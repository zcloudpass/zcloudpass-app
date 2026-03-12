use std::sync::Mutex;
use tauri::Manager;

struct ClipboardTimer(Mutex<Option<std::thread::JoinHandle<()>>>);

#[tauri::command]
fn copy_and_clear(app: tauri::AppHandle, text: String, delay_secs: u64) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;

    app.clipboard()
        .write_text(&text)
        .map_err(|e| e.to_string())?;

    // Cancel any existing timer
    let timer_state = app.state::<ClipboardTimer>();
    let mut handle = timer_state.0.lock().unwrap();
    if let Some(h) = handle.take() {
        drop(h);
    }

    let app_handle = app.clone();
    *handle = Some(std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(delay_secs));
        if let Ok(()) = tauri_plugin_clipboard_manager::ClipboardExt::clipboard(&app_handle)
            .write_text("")
        {
            log::info!("Clipboard cleared after {} seconds", delay_secs);
        }
    }));

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_biometric::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(ClipboardTimer(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![copy_and_clear])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
