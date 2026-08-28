#=== NINESEAS :: RES_CORE (첫 스크립트로 배치) ===
module NINESEAS
  RES_X = 544
  RES_Y = 416
  W     = 1920
  H     = 1080
  FW    = 1280
  FH    = 720
end
begin
  Graphics.resize_screen(NINESEAS::W, NINESEAS::H)
  $res_mode = :fullhd
rescue StandardError => e
  begin
    Graphics.resize_screen(NINESEAS::FW, NINESEAS::FH)
    $res_mode = :hd_fallback
  rescue StandardError
    $res_mode = :native
  end
end
Graphics.frame_rate = 60 rescue nil
Font.default_name = "Verdana"
Font.default_size = $res_mode == :fullhd ? 28 : 22