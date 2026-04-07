fn main() {
    // Tell Cargo to re-run this build script (and hence rebuild main.rs with
    // its include_str! calls) when the shared schema file changes.
    println!("cargo:rerun-if-changed=../../database/schema.sql");
    tauri_build::build()
}
