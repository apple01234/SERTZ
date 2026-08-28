#=== NINESEAS :: UI_ANCHOR ===
class Window_Base
  def anchor!(ax, ay, ox=0, oy=0)
    self.x = case ax
             when :l then 12
             when :r then Graphics.width - self.width - 12
             else (Graphics.width - self.width) / 2 + ox
             end
    self.y = case ay
             when :t then 12
             when :b then Graphics.height - self.height - 12
             else (Graphics.height - self.height) / 2 + oy
             end
  end
end