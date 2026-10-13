use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

struct ServerProcess(Mutex<Option<Child>>);

fn log_launcher(msg: &str) {
    if let Ok(app_data) = std::env::var("APPDATA") {
        let dir = PathBuf::from(app_data).join("GestorContrasenas");
        let _ = std::fs::create_dir_all(&dir);
        let log_file = dir.join("launcher.log");
        if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(log_file) {
            let _ = writeln!(f, "[tauri-launcher] {}", msg);
        }
    }
}

fn strip_unc(path: PathBuf) -> PathBuf {
    let s = path.to_string_lossy();
    if s.starts_with(r"\\?\") {
        PathBuf::from(&s[4..])
    } else {
        path
    }
}

fn find_server_paths(app: &tauri::App) -> Option<(PathBuf, PathBuf, PathBuf)> {
    let mut candidate_dirs: Vec<PathBuf> = Vec::new();

    // 1. Recursos instalados por Tauri (ejecutable instalado con NSIS o MSI)
    if let Ok(resource_dir) = app.path().resource_dir() {
        candidate_dirs.push(resource_dir.join("server"));
        candidate_dirs.push(resource_dir);
    }

    // 2. Directorio adyacente al ejecutable y sus ancestros (para desarrollo y portable)
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(exe_dir) = current_exe.parent() {
            candidate_dirs.push(exe_dir.join("server"));
            candidate_dirs.push(exe_dir.to_path_buf());
            // Si está en target/release o target/debug, subir a src-tauri
            if let Some(target_dir) = exe_dir.parent() {
                if let Some(src_tauri) = target_dir.parent() {
                    candidate_dirs.push(src_tauri.join("server"));
                }
            }
        }
    }

    // 3. Directorio de trabajo actual
    if let Ok(cwd) = std::env::current_dir() {
        candidate_dirs.push(cwd.join("server"));
        candidate_dirs.push(cwd.join("src-tauri").join("server"));
        candidate_dirs.push(cwd.join("frontend").join("src-tauri").join("server"));
    }

    log_launcher(&format!("Buscando servidor en {} candidatos...", candidate_dirs.len()));

    for dir in candidate_dirs {
        // Opción A: Archivos directamente en dir
        let node_a = dir.join("node.exe");
        let script_a = dir.join("dist").join("index.js");
        if node_a.exists() && script_a.exists() {
            log_launcher(&format!("Servidor encontrado en: {}", dir.display()));
            return Some((node_a, script_a, dir));
        }

        // Opción B: Archivos en subcarpeta server/
        let node_b = dir.join("server").join("node.exe");
        let script_b = dir.join("server").join("dist").join("index.js");
        let server_b = dir.join("server");
        if node_b.exists() && script_b.exists() {
            log_launcher(&format!("Servidor encontrado en subcarpeta: {}", server_b.display()));
            return Some((node_b, script_b, server_b));
        }
    }

    log_launcher("No se encontró backend empaquetado en ningún directorio candidato.");
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ServerProcess(Mutex::new(None)))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Iniciar backend Express en segundo plano
            if let Some((node_exe, script, work_dir)) = find_server_paths(app) {
                let clean_node = strip_unc(node_exe);
                let clean_script = strip_unc(script);
                let clean_work = strip_unc(work_dir);

                let mut cmd = Command::new(&clean_node);
                cmd.arg(&clean_script);
                cmd.current_dir(&clean_work);

                #[cfg(windows)]
                cmd.creation_flags(CREATE_NO_WINDOW);

                cmd.env("PORT", "3000");
                cmd.env("NODE_ENV", "production");

                // Redirigir logs del backend al archivo backend.log en AppData
                if let Ok(app_data) = std::env::var("APPDATA") {
                    let log_dir = PathBuf::from(app_data).join("GestorContrasenas");
                    let _ = std::fs::create_dir_all(&log_dir);
                    let backend_log = log_dir.join("backend.log");
                    if let Ok(file) = OpenOptions::new().create(true).append(true).open(backend_log) {
                        if let Ok(err_file) = file.try_clone() {
                            cmd.stdout(file);
                            cmd.stderr(err_file);
                        }
                    }
                }

                match cmd.spawn() {
                    Ok(child) => {
                        log_launcher(&format!("Backend iniciado con éxito (PID {})", child.id()));
                        let state = app.state::<ServerProcess>();
                        if let Ok(mut lock) = state.0.lock() {
                            *lock = Some(child);
                        }
                    }
                    Err(err) => {
                        log_launcher(&format!("Error crítico al iniciar backend: {:?}", err));
                    }
                }
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<ServerProcess>() {
                    if let Ok(mut lock) = state.0.lock() {
                        if let Some(mut child) = lock.take() {
                            let _ = child.kill();
                            log_launcher("Backend finalizado correctamente al cerrar ventana.");
                        }
                    }
                }
            }
        });
}
