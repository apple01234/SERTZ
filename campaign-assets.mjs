/** Preserve the user-supplied game packs in every web/native build. */
export function allowedCampaignAsset(name) {
  return (
    !name.split("/").some((part) => part.startsWith(".")) &&
    !name.startsWith("campaign/skill-sunburst.")
  );
}
export async function pruneCampaignAssets() {
  // Source art is shared by the restored RPG engine, costumes, housing and skill systems.
  // Do not prune assets based only on the story scene's initial preload roster.
}
