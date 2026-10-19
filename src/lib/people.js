// Helpers shared by the team pages.
export const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
export function teamView(d, team) {
  const person = Object.fromEntries(d.people.map((p) => [p.slug, p]));
  const rows = d.team_memberships.filter((m) => m.team_slug === team.slug && person[m.person_slug])
    .map((m) => ({ ...person[m.person_slug], role: m.role, current: m.is_current, isLead: m.person_slug === team.lead_slug }));
  const byName = (a, b) => (b.isLead - a.isLead) || (a.sort_order - b.sort_order);
  return {
    current: rows.filter((r) => r.current).sort(byName),
    past: rows.filter((r) => !r.current).sort(byName),
    projects: d.projects.filter((p) => p.team_slug === team.slug),
    publications: d.publications.filter((p) => p.team_slug === team.slug),
  };
}
// Split a bio into its first sentence and the remainder (skips "Dr.", "Prof." etc.).
const ABBR = /^(dr|mr|mrs|ms|prof|st|sr|jr|md|mph)$/i;
export function splitBio(bio = '') {
  const text = bio.trim();
  const re = /[.!?]+(?=\s+\S)/g;
  let m;
  while ((m = re.exec(text))) {
    const word = text.slice(0, m.index).split(/\s+/).pop();
    if (ABBR.test(word)) continue;
    const cut = m.index + m[0].length;
    return [text.slice(0, cut).trim(), text.slice(cut).trim()];
  }
  return [text, ''];
}
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
// Everything one member page needs: their teams (current first), and the publications tagged to those teams, newest first.
export function personView(d, person) {
  const team = Object.fromEntries(d.teams.map((t) => [t.slug, t]));
  const memberships = d.team_memberships.filter((m) => m.person_slug === person.slug && team[m.team_slug])
    .map((m) => ({ ...m, team: team[m.team_slug], isLead: team[m.team_slug].lead_slug === person.slug }))
    .sort((a, b) => (b.is_current - a.is_current) || a.team.name.localeCompare(b.team.name));
  const slugs = new Set(memberships.map((m) => m.team_slug));
  const publications = d.publications.filter((p) => slugs.has(p.team_slug)).sort((a, b) => (b.year || 0) - (a.year || 0));
  return { memberships, publications };
}
