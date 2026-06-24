// King Karl Launcher - Rust backend
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use walkdir::WalkDir;
use regex::Regex;
use std::fs;
use std::time::Instant;

// ---------- Config ----------

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
struct LauncherConfig {
    project_root: String,
    web_url: String,
    last_deploy_iso: Option<String>,
    presets: Vec<String>,
    admin_email: Option<String>,
    admin_password: Option<String>,
}

fn config_path() -> PathBuf {
    let mut p = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    p.push(".kk-launcher");
    std::fs::create_dir_all(&p).ok();
    p.push("config.json");
    p
}

#[tauri::command]
fn get_config() -> LauncherConfig {
    let p = config_path();
    let default_root = std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")).to_string_lossy().to_string();
    if !p.exists() {
        return LauncherConfig {
            project_root: default_root,
            web_url: "http://localhost:5000".into(),
            last_deploy_iso: None,
            presets: vec![],
            admin_email: None,
            admin_password: None,
        };
    }
    let txt = std::fs::read_to_string(&p).unwrap_or_default();
    let mut cfg: LauncherConfig = serde_json::from_str(&txt).unwrap_or_default();
    if cfg.project_root.is_empty() {
        cfg.project_root = default_root;
    }
    cfg
}

#[tauri::command]
fn save_config(cfg: LauncherConfig) -> Result<(), String> {
    let p = config_path();
    let txt = serde_json::to_string_pretty(&cfg).map_err(|e| e.to_string())?;
    std::fs::write(&p, txt).map_err(|e| e.to_string())?;
    Ok(())
}

// ---------- Process state ----------

struct ProcRegistry {
    next_id: AtomicU32,
    children: Mutex<Vec<(u32, Child)>>,
}

impl ProcRegistry {
    fn new() -> Self {
        Self {
            next_id: AtomicU32::new(1),
            children: Mutex::new(Vec::new()),
        }
    }
}

// ---------- Shell streaming ----------

#[derive(Serialize, Clone)]
struct ShellEvent {
    run_id: u32,
    stream: String, // "stdout" | "stderr" | "exit"
    line: String,
    code: Option<i32>,
}

#[tauri::command]
async fn stream_shell(
    app: AppHandle,
    reg: State<'_, ProcRegistry>,
    cwd: String,
    cmd: String,
) -> Result<u32, String> {
    let run_id = reg.next_id.fetch_add(1, Ordering::SeqCst);

    // Windows: route through cmd /c so .bat/npm/git resolve
    let mut command = Command::new("cmd");
    command
        .arg("/c")
        .arg(&cmd)
        .current_dir(&cwd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        // CREATE_NO_WINDOW = 0x08000000
        command.creation_flags(0x08000000);
    }

    let mut child = command.spawn().map_err(|e| e.to_string())?;
    let stdout = child.stdout.take().ok_or("no stdout")?;
    let stderr = child.stderr.take().ok_or("no stderr")?;

    let app_out = app.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_out.emit(
                "shell-event",
                ShellEvent {
                    run_id,
                    stream: "stdout".into(),
                    line,
                    code: None,
                },
            );
        }
    });

    let app_err = app.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_err.emit(
                "shell-event",
                ShellEvent {
                    run_id,
                    stream: "stderr".into(),
                    line,
                    code: None,
                },
            );
        }
    });

    // Wait for exit in separate task
    let app_exit = app.clone();
    tokio::spawn(async move {
        let status = child.wait().await;
        let code = status.ok().and_then(|s| s.code());
        let _ = app_exit.emit(
            "shell-event",
            ShellEvent {
                run_id,
                stream: "exit".into(),
                line: String::new(),
                code,
            },
        );
    });

    Ok(run_id)
}

// ---------- Quick helpers ----------

#[derive(Serialize)]
struct GitStatus {
    branch: String,
    ahead: u32,
    behind: u32,
    dirty: bool,
}

fn run_capture(cwd: &str, args: &[&str]) -> Result<String, String> {
    let out = std::process::Command::new("cmd")
        .arg("/c")
        .arg(args.join(" "))
        .current_dir(cwd)
        .output()
        .map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

#[tauri::command]
fn get_git_status(cwd: String) -> Result<GitStatus, String> {
    if cwd.is_empty() {
        return Err("project_root not set".into());
    }
    let branch = run_capture(&cwd, &["git", "rev-parse", "--abbrev-ref", "HEAD"])?;
    let ahead_behind = run_capture(
        &cwd,
        &["git", "rev-list", "--left-right", "--count", "origin/main...HEAD"],
    )
    .unwrap_or_default();
    let mut parts = ahead_behind.split_whitespace();
    let behind: u32 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
    let ahead: u32 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
    let dirty_raw = run_capture(&cwd, &["git", "status", "--porcelain"]).unwrap_or_default();
    Ok(GitStatus {
        branch,
        ahead,
        behind,
        dirty: !dirty_raw.is_empty(),
    })
}

#[tauri::command]
fn check_port(port: u16) -> bool {
    std::net::TcpStream::connect(("127.0.0.1", port)).is_ok()
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    // Windows: start "" <url> opens in default browser
    std::process::Command::new("cmd")
        .args(["/c", "start", "", &url])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ---------- SSW Sync Engine ----------

#[derive(Serialize)]
struct SyncResult {
    elapsed_ms: u128,
    mechs_copied: u32,
    mechs_indexed: u32,
    vehicles_indexed: u32,
}

#[derive(Serialize)]
struct MechIndexEntry {
    name: String,
    bv2: u32,
    file: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    year: Option<u32>,
}

#[derive(Serialize)]
struct VehicleIndexEntry {
    name: String,
    bv2: u32,
    file: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    year: Option<u32>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    vtype: Option<String>,
}

fn extract_xml(content: &str, tag: &str) -> String {
    let re = Regex::new(&format!(r"<[^>]*{}[^>]*>([^<]*)</{}>", tag, tag)).unwrap();
    if let Some(caps) = re.captures(content) {
        caps.get(1).map(|m| m.as_str().trim().to_string()).unwrap_or_default()
    } else {
        let re2 = Regex::new(&format!(r"<{}>([^<]*)</{}>", tag, tag)).unwrap();
        if let Some(caps) = re2.captures(content) {
            caps.get(1).map(|m| m.as_str().trim().to_string()).unwrap_or_default()
        } else {
            String::new()
        }
    }
}

#[tauri::command]
async fn sync_ssw_database(cwd: String) -> Result<SyncResult, String> {
    let start = Instant::now();
    let src_dir = PathBuf::from("E:\\Drive\\CBT\\SSW_0.7.4");
    let dest_mechs = PathBuf::from(&cwd).join("public").join("assets").join("mechs");
    let dest_vehicles = PathBuf::from(&cwd).join("public").join("assets").join("vehicles");

    fs::create_dir_all(&dest_mechs).map_err(|e| e.to_string())?;
    fs::create_dir_all(&dest_vehicles).map_err(|e| e.to_string())?;

    let mut mechs_copied = 0;
    
    // 1. Copy .ssw and .saw from origin
    if src_dir.exists() {
        for entry in WalkDir::new(&src_dir).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let name = entry.file_name().to_string_lossy().to_lowercase();
                if name.ends_with(".ssw") || name.ends_with(".saw") {
                    let dest_path = if name.ends_with(".ssw") {
                        dest_mechs.join(entry.file_name())
                    } else {
                        dest_vehicles.join(entry.file_name())
                    };
                    
                    if !dest_path.exists() {
                        if let Ok(_) = fs::copy(entry.path(), &dest_path) {
                            mechs_copied += 1;
                        }
                    }
                }
            }
        }
    }

    // 2. Index Mechs (.ssw and .mtf)
    let mut mech_index = Vec::new();
    let name_re = Regex::new(r#"name="([^"]*)""#).unwrap();
    let model_re = Regex::new(r#"model="([^"]*)""#).unwrap();

    if let Ok(entries) = fs::read_dir(&dest_mechs) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            let file_name = entry.file_name().to_string_lossy().to_string();
            
            if file_name.ends_with(".ssw") {
                if let Ok(content) = fs::read_to_string(&path) {
                    let name = name_re.captures(&content).and_then(|c| c.get(1)).map(|m| m.as_str().trim()).unwrap_or("");
                    let model = model_re.captures(&content).and_then(|c| c.get(1)).map(|m| m.as_str().trim()).unwrap_or("");
                    let mut full_name = format!("{} {}", name, model).trim().to_string();
                    if full_name.is_empty() { full_name = file_name.clone(); }
                    
                    let bv2 = extract_xml(&content, "battle_value").parse().unwrap_or(0);
                    let year = extract_xml(&content, "year").parse().ok();

                    mech_index.push(MechIndexEntry { name: full_name, bv2, file: file_name, year });
                }
            } else if file_name.ends_with(".mtf") {
                if let Ok(content) = fs::read_to_string(&path) {
                    let mut chassis = "";
                    let mut model = "";
                    for line in content.lines() {
                        if line.starts_with("chassis:") { chassis = line.split(':').nth(1).unwrap_or("").trim(); }
                        if line.starts_with("model:") { model = line.split(':').nth(1).unwrap_or("").trim(); }
                    }
                    let mut full_name = format!("{} {}", chassis, model).trim().to_string();
                    if full_name.is_empty() { full_name = file_name.clone(); }
                    mech_index.push(MechIndexEntry { name: full_name, bv2: 0, file: file_name, year: None });
                }
            }
        }
    }
    
    mech_index.sort_by(|a, b| a.name.cmp(&b.name));
    let _ = fs::write(dest_mechs.join("index.json"), serde_json::to_string_pretty(&mech_index).unwrap());

    // 3. Index Vehicles (.saw)
    let mut vehicle_index = Vec::new();
    let motive_re = Regex::new(r#"<motive[^>]*type="([^"]*)""#).unwrap();

    if let Ok(entries) = fs::read_dir(&dest_vehicles) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            let file_name = entry.file_name().to_string_lossy().to_string();
            
            if file_name.ends_with(".saw") {
                if let Ok(content) = fs::read_to_string(&path) {
                    let name = name_re.captures(&content).and_then(|c| c.get(1)).map(|m| m.as_str().trim()).unwrap_or("");
                    let mut full_name = name.to_string();
                    if full_name.is_empty() { full_name = file_name.clone(); }
                    
                    let bv2 = extract_xml(&content, "battle_value").parse().unwrap_or(0);
                    let year = extract_xml(&content, "year").parse().ok();
                    let vtype = motive_re.captures(&content).and_then(|c| c.get(1)).map(|m| m.as_str().trim().to_string());

                    vehicle_index.push(VehicleIndexEntry { name: full_name, bv2, file: file_name, year, vtype });
                }
            }
        }
    }

    vehicle_index.sort_by(|a, b| a.name.cmp(&b.name));
    let _ = fs::write(dest_vehicles.join("index.json"), serde_json::to_string_pretty(&vehicle_index).unwrap());

    Ok(SyncResult {
        elapsed_ms: start.elapsed().as_millis(),
        mechs_copied,
        mechs_indexed: mech_index.len() as u32,
        vehicles_indexed: vehicle_index.len() as u32,
    })
}

// ---------- Entry ----------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ProcRegistry::new())
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            stream_shell,
            get_git_status,
            check_port,
            open_url,
            sync_ssw_database,
        ])
        .setup(|app| {
            let _ = app.handle();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
