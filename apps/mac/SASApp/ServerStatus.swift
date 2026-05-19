import Foundation

enum ServerStatus: Equatable {
  case stopped
  case starting
  case running
  case error(String)

  var displayLabel: String {
    switch self {
    case .stopped: return "Stopped"
    case .starting: return "Starting…"
    case .running: return "Running"
    case .error(let msg): return "Error: \(msg)"
    }
  }

  var symbolName: String {
    switch self {
    case .stopped: return "circle.fill"
    case .starting: return "circle.dotted"
    case .running: return "checkmark.circle.fill"
    case .error: return "exclamationmark.circle.fill"
    }
  }
}
