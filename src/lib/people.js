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
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
