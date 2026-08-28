#=== NINESEAS :: RELIC HP COST (성물 = HP 12% 희생) ===
module NINESEAS
  RELICS = (101..107).to_a.freeze
  def self.relic?(id); RELICS.include?(id); end
end
class Game_Actor
  def relic_cost(skill_id)
    NINESEAS::RELIC?(skill_id) ? (mhp * 0.12).to_i : 0
  end
  def pay_relic(skill_id)
    cost = relic_cost(skill_id)
    return 0 if cost <= 0
    self.hp -= cost
    cost
  end
end
class Window_BattleSkill
  attr_reader :actor
  alias nineseas_battle_skill_on_ok on_ok
  def on_ok
    sk = @data && @data[@index]
    @actor.pay_relic(sk.id) if sk && NINESEAS::RELICS.include?(sk.id)
    nineseas_battle_skill_on_ok
  end
end