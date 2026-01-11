use tauri::Manager;

#[cfg(desktop)]
use tauri::menu::{CheckMenuItem, MenuBuilder, MenuItemKind, MenuItem, SubmenuBuilder};

#[cfg(desktop)]
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

#[cfg(desktop)]
use std::sync::Mutex;

#[cfg(desktop)]
struct TrayState {
    always_on_top_item: CheckMenuItem<tauri::Wry>,
}

#[cfg(desktop)]
struct TrayStateWrapper(Mutex<Option<TrayState>>);

const APP_MENU_ID: &str = "app_menu";
const QUIT_MENU_ID: &str = "quit";
const VIEW_MENU_ID: &str = "view_menu";
const ALWAYS_ON_TOP_MENU_ID: &str = "always_on_top";

// Tray menu IDs
const TRAY_SHOW_MENU_ID: &str = "tray_show";
const TRAY_ALWAYS_ON_TOP_MENU_ID: &str = "tray_always_on_top";
const TRAY_QUIT_MENU_ID: &str = "tray_quit";

#[tauri::command]
fn toggle_always_on_top(
    window: tauri::WebviewWindow,
    app: tauri::AppHandle,
) -> Result<bool, String> {
    toggle_always_on_top_inner(&window, &app)
}

fn toggle_always_on_top_inner(
    window: &tauri::WebviewWindow,
    app: &tauri::AppHandle,
) -> Result<bool, String> {
    let is_on_top = window.is_always_on_top().map_err(|err| err.to_string())?;
    let next_state = !is_on_top;
    window
        .set_always_on_top(next_state)
        .map_err(|err| err.to_string())?;
    update_always_on_top_menu(app, next_state);
    Ok(next_state)
}

#[cfg(desktop)]
fn update_always_on_top_menu(app: &tauri::AppHandle, checked: bool) {
    // Update app menu
    if let Some(menu) = app.menu() {
        if let Some(MenuItemKind::Submenu(view_menu)) = menu.get(VIEW_MENU_ID) {
            if let Some(MenuItemKind::Check(item)) = view_menu.get(ALWAYS_ON_TOP_MENU_ID) {
                let _ = item.set_checked(checked);
            }
        }
    }
    // Update tray menu
    if let Some(state) = app.try_state::<TrayStateWrapper>() {
        if let Ok(guard) = state.0.lock() {
            if let Some(ref tray_state) = *guard {
                let _ = tray_state.always_on_top_item.set_checked(checked);
            }
        }
    }
}

#[cfg(not(desktop))]
fn update_always_on_top_menu(_app: &tauri::AppHandle, _checked: bool) {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            #[cfg(desktop)]
            {
                let handle = app.handle();

                // Set window background to transparent
                if let Some(window) = app.get_webview_window("main") {
                    #[cfg(target_os = "macos")]
                    {
                        let _ = window.set_background_color(None);
                    }
                    #[cfg(target_os = "windows")]
                    {
                        // Windows requires explicit RGBA with alpha = 0 for transparency
                        use tauri::window::Color;
                        let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
                    }
                }

                let is_on_top = app
                    .get_webview_window("main")
                    .and_then(|window| window.is_always_on_top().ok())
                    .unwrap_or(true);

                // Create App menu with Quit item
                let quit_item = MenuItem::with_id(
                    handle,
                    QUIT_MENU_ID,
                    "Quit",
                    true,
                    Some("Cmd+Q"),
                )?;
                let app_menu = SubmenuBuilder::with_id(handle, APP_MENU_ID, "App")
                    .item(&quit_item)
                    .build()?;

                // Create View menu with Always on Top toggle
                let toggle_item = CheckMenuItem::with_id(
                    handle,
                    ALWAYS_ON_TOP_MENU_ID,
                    "Always on Top",
                    true,
                    is_on_top,
                    None::<&str>,
                )?;
                let view_menu = SubmenuBuilder::with_id(handle, VIEW_MENU_ID, "View")
                    .item(&toggle_item)
                    .build()?;

                let menu = MenuBuilder::new(handle)
                    .item(&app_menu)
                    .item(&view_menu)
                    .build()?;
                app.set_menu(menu)?;

                // Create system tray with context menu
                let tray_show_item = MenuItem::with_id(
                    handle,
                    TRAY_SHOW_MENU_ID,
                    "Show Window",
                    true,
                    None::<&str>,
                )?;
                let tray_always_on_top_item = CheckMenuItem::with_id(
                    handle,
                    TRAY_ALWAYS_ON_TOP_MENU_ID,
                    "Always on Top",
                    true,
                    is_on_top,
                    None::<&str>,
                )?;
                let tray_quit_item = MenuItem::with_id(
                    handle,
                    TRAY_QUIT_MENU_ID,
                    "Quit",
                    true,
                    None::<&str>,
                )?;

                let tray_menu = MenuBuilder::new(handle)
                    .item(&tray_show_item)
                    .separator()
                    .item(&tray_always_on_top_item)
                    .separator()
                    .item(&tray_quit_item)
                    .build()?;

                TrayIconBuilder::with_id("main_tray")
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&tray_menu)
                    .show_menu_on_left_click(false)
                    .tooltip("GTD Timer")
                    .on_tray_icon_event(|tray, event| {
                        // Show window on left click
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .on_menu_event(|app, event| {
                        if event.id() == TRAY_SHOW_MENU_ID {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        } else if event.id() == TRAY_ALWAYS_ON_TOP_MENU_ID {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = toggle_always_on_top_inner(&window, app);
                            }
                        } else if event.id() == TRAY_QUIT_MENU_ID {
                            app.exit(0);
                        }
                    })
                    .build(app)?;

                // Store tray state for updating menu items later
                app.manage(TrayStateWrapper(Mutex::new(Some(TrayState {
                    always_on_top_item: tray_always_on_top_item,
                }))));
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![toggle_always_on_top]);

    #[cfg(desktop)]
    {
        builder = builder.on_menu_event(|app, event| {
            if event.id() == QUIT_MENU_ID {
                app.exit(0);
            } else if event.id() == ALWAYS_ON_TOP_MENU_ID {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = toggle_always_on_top_inner(&window, app);
                }
            }
        });
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
