#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$ROOT_DIR/desktop"
RUN_DIR="$ROOT_DIR/.run"
PORT="1421"

MODE_FILE="$RUN_DIR/desktop.mode"
PID_FILE="$RUN_DIR/desktop.pid"
LOG_FILE="$RUN_DIR/desktop.log"

mkdir -p "$RUN_DIR"

is_pid_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

read_pid_file() {
  if [[ -f "$PID_FILE" ]]; then
    cat "$PID_FILE"
  fi
}

read_mode_file() {
  if [[ -f "$MODE_FILE" ]]; then
    cat "$MODE_FILE"
  else
    echo ""
  fi
}

resolve_mode() {
  local requested="${1:-tauri}"
  case "$requested" in
    tauri|desktop)
      echo "tauri"
      ;;
    web|vite)
      echo "web"
      ;;
    *)
      echo "Modo invalido: $requested"
      echo "Usa: tauri | web"
      exit 1
      ;;
  esac
}

write_runtime_state() {
  local mode="$1"
  local pid="$2"
  local log="$3"
  echo "$mode" > "$MODE_FILE"
  echo "$pid" > "$PID_FILE"
  echo "$log" > "$LOG_FILE"
}

read_log_path() {
  if [[ -f "$LOG_FILE" ]]; then
    cat "$LOG_FILE"
  fi
}

cleanup_state() {
  rm -f "$MODE_FILE" "$PID_FILE" "$LOG_FILE"
}

stop_by_port_if_needed() {
  if lsof -ti:"$PORT" >/dev/null 2>&1; then
    lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
  fi
}

start_server() {
  local mode
  mode="$(resolve_mode "${1:-tauri}")"

  local existing_pid existing_mode
  existing_pid="$(read_pid_file || true)"
  existing_mode="$(read_mode_file || true)"

  if [[ -n "$existing_pid" ]] && is_pid_running "$existing_pid"; then
    echo "Desktop ya esta levantado (modo: ${existing_mode:-desconocido}, pid: $existing_pid)."
    echo "Log: $(read_log_path)"
    return 0
  fi

  cleanup_state

  local log_path="$RUN_DIR/desktop-${mode}.log"

  if [[ "$mode" == "tauri" ]]; then
    stop_by_port_if_needed
    (
      cd "$DESKTOP_DIR"
      npm run tauri dev
    ) >"$log_path" 2>&1 &
  else
    if lsof -ti:"$PORT" >/dev/null 2>&1; then
      echo "El puerto $PORT ya esta en uso."
      echo "Tip: $0 down"
      return 1
    fi
    (
      cd "$DESKTOP_DIR"
      npm run dev
    ) >"$log_path" 2>&1 &
  fi

  local new_pid=$!
  write_runtime_state "$mode" "$new_pid" "$log_path"
  sleep 2

  if is_pid_running "$new_pid"; then
    if [[ "$mode" == "tauri" ]]; then
      echo "Desktop TAURI levantado (pid: $new_pid)."
      echo "Webview: app nativa + Vite en http://127.0.0.1:$PORT/"
    else
      echo "Desktop WEB levantado (pid: $new_pid)."
      echo "URL: http://127.0.0.1:$PORT/"
    fi
    echo "Log: $log_path"
  else
    echo "No se pudo levantar el desktop (modo: $mode)."
    echo "Ultimas lineas del log:"
    tail -n 50 "$log_path" || true
    cleanup_state
    return 1
  fi
}

stop_server() {
  local pid mode
  pid="$(read_pid_file || true)"
  mode="$(read_mode_file || true)"

  if [[ -n "$pid" ]] && is_pid_running "$pid"; then
    kill "$pid" 2>/dev/null || true
    sleep 1
    if is_pid_running "$pid"; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    stop_by_port_if_needed
    cleanup_state
    echo "Desktop bajado (modo: ${mode:-desconocido}, pid: $pid)."
    return 0
  fi

  stop_by_port_if_needed
  cleanup_state
  echo "Desktop ya estaba apagado."
}

status_server() {
  local pid mode log
  pid="$(read_pid_file || true)"
  mode="$(read_mode_file || true)"
  log="$(read_log_path || true)"

  if [[ -n "$pid" ]] && is_pid_running "$pid"; then
    echo "Desktop arriba (modo: ${mode:-desconocido}, pid: $pid)."
    if [[ "$mode" == "web" ]]; then
      echo "URL: http://127.0.0.1:$PORT/"
    else
      echo "Modo tauri: app nativa (usa la ventana del sistema)."
      echo "Vite: http://127.0.0.1:$PORT/"
    fi
    [[ -n "$log" ]] && echo "Log: $log"
    return 0
  fi

  if lsof -ti:"$PORT" >/dev/null 2>&1; then
    echo "Hay un proceso escuchando en $PORT (sin estado del script)."
    lsof -ti:"$PORT" | tr '\n' ' '
    echo
    return 0
  fi

  echo "Desktop apagado."
}

logs_server() {
  local log
  log="$(read_log_path || true)"
  if [[ -n "$log" ]] && [[ -f "$log" ]]; then
    tail -n 120 "$log"
  else
    echo "No hay logs todavia."
  fi
}

usage() {
  cat <<EOF2
Uso: $0 {up|down|restart|status|logs} [tauri|web]

  up [tauri|web]      Levanta desktop (default: tauri)
  down                Baja desktop
  restart [mode]      Reinicia desktop
  status              Estado actual
  logs                Ver ultimas lineas del log

Ejemplos:
  $0 up           # app desktop (Tauri)
  $0 up tauri     # igual que arriba
  $0 up web       # solo Vite en navegador
EOF2
}

case "${1:-}" in
  up)
    start_server "${2:-tauri}"
    ;;
  down)
    stop_server
    ;;
  restart)
    stop_server
    start_server "${2:-tauri}"
    ;;
  status)
    status_server
    ;;
  logs)
    logs_server
    ;;
  *)
    usage
    exit 1
    ;;
esac
