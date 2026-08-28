#=== Fullscreen++ (F11 토글, 배율 유지) — VX Ace ===
module FullscreenPlus
  module Win
    ShowCursor        = Win32API.new('user32','ShowCursor','i','i')
    GetForegroundWindow = Win32API.new('user32','GetForegroundWindow','v','i')
    GetWindowRect     = Win32API.new('user32','GetWindowRect','i','pppp')
    GetSystemMetrics  = Win32API.new('user32','GetSystemMetrics','i','i')
    SetWindowPos      = Win32API.new('user32','SetWindowPos','iiiiiii','i')
    SetWindowLongA    = Win32API.new('user32','SetWindowLongA','iii','i')
    GetWindowLongA    = Win32API.new('user32','GetWindowLongA','ii','i')
    MoveWindow        = Win32API.new('user32','MoveWindow','iiiiii','i')
    GWL_STYLE = -16; WS_CAPTION = 0x00C00000; WS_THICKFRAME = 0x00040000
    SWP_NOZORDER = 0x4
  end
  def self.fullscreen?
    ws = Win::GetWindowLongA.call(Win::GetForegroundWindow.call, Win::GWL_STYLE)
    (ws & Win::WS_CAPTION) == 0
  end
  def self.fullscreen
    hwnd = Win::GetForegroundWindow.call
    ws = Win::GetWindowLongA.call(hwnd, Win::GWL_STYLE)
    Win::GetWindowLongA.call(hwnd, Win::GWL_STYLE)
    Win::SetWindowLongA.call(hwnd, Win::GWL_STYLE, (ws & ~(Win::WS_CAPTION | Win::WS_THICKFRAME)))
    w = Win::GetSystemMetrics.call(0); h = Win::GetSystemMetrics.call(1)
    Win::SetWindowPos.call(hwnd, 0, 0, 0, w, h, Win::SWP_NOZORDER)
    Win::ShowCursor.call(0)
  end
  def self.windowed
    hwnd = Win::GetForegroundWindow.call
    ws = Win::GetWindowLongA.call(hwnd, Win::GWL_STYLE)
    Win::SetWindowLongA.call(hwnd, Win::GWL_STYLE, (ws | Win::WS_CAPTION | Win::WS_THICKFRAME))
    Win::SetWindowPos.call(hwnd, 0, 0, 0, 1280, 720, Win::SWP_NOZORDER)
    Win::ShowCursor.call(1)
  end
  module_function
  class << Graphics
    unless method_defined?(:nineseas_update)
      alias nineseas_update update
    end
    def update
      nineseas_update
      if $fullscreen_toggle_flag
        $fullscreen_toggle_flag = false
        FullscreenPlus.fullscreen? ? FullscreenPlus.windowed : FullscreenPlus.fullscreen
      end
    end
  end
end

class << Graphics
  def update
    FullscreenPlus.fullscreen? ? FullscreenPlus.windowed : nil
    super
  end
end
module FullscreenPlus
  def self.toggle
    fullscreen? ? windowed : fullscreen
  end
end
class Scene_Base
  alias ninesaes_fs_update update
  def update
    FullscreenPlus.toggle if Input.trigger?(Input::F11)
    ninesaes_fs_update
  end
end