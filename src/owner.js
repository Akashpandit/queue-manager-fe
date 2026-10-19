const PREFIX = "owner:";

export function getOwner(publicId) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + publicId) || "null");
  } catch {
    return null;
  }
}

export function saveOwner(publicId, value) {
  localStorage.setItem(PREFIX + publicId, JSON.stringify(value));
}

export function removeOwner(publicId) {
  localStorage.removeItem(PREFIX + publicId);
}

export function listOwners() {
  const shops = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      const data = getOwner(key.slice(PREFIX.length));
      shops.push({ publicId: key.slice(PREFIX.length), name: data?.name || "My shop" });
    }
  }
  return shops;
}