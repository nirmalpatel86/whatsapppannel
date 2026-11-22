/**
 * Computes which companyIds a non-super_admin user is allowed to see.
 *
 * Every reseller/admin gets their OWN dedicated company when created (see user
 * controllers' `create`), so companies are never shared between sibling resellers.
 * Visibility is therefore the set of companyIds belonging to the user themself plus
 * every descendant they (directly or indirectly) created, found by walking the
 * `parentId` tree. This one function is what makes:
 *   - an `admin` see their own users AND resellers, and those resellers' own users
 *   - a `reseller` see only the users they personally created (their own company)
 *   - a plain `user` see only themself (no descendants, so just their own companyId)
 *
 * super_admin is NOT handled here — callers should check `role === 'super_admin'`
 * first and skip filtering entirely (they see everything, across all companies).
 *
 * @param {import('sequelize').Model} UserModel - e.g. User, SmsUser, BmUser
 * @param {{ id: number, companyId: number|null }} currentUser
 * @returns {Promise<number[]>} companyIds visible to currentUser (always includes their own)
 */
async function getVisibleCompanyIds(UserModel, currentUser) {
  const allUsers = await UserModel.findAll({
    attributes: ['id', 'parentId', 'companyId'],
    raw: true,
  });

  const childrenByParentId = new Map();
  for (const u of allUsers) {
    if (u.parentId == null) continue;
    if (!childrenByParentId.has(u.parentId)) childrenByParentId.set(u.parentId, []);
    childrenByParentId.get(u.parentId).push(u);
  }

  const companyIds = new Set();
  if (currentUser.companyId) companyIds.add(currentUser.companyId);

  const queue = [currentUser.id];
  const visited = new Set(queue);
  while (queue.length) {
    const id = queue.shift();
    const children = childrenByParentId.get(id) || [];
    for (const child of children) {
      if (visited.has(child.id)) continue; // guard against any accidental cycle
      visited.add(child.id);
      if (child.companyId) companyIds.add(child.companyId);
      queue.push(child.id);
    }
  }

  return [...companyIds];
}

module.exports = { getVisibleCompanyIds };
