export const encodeProfile = (data) => {
  return btoa(encodeURIComponent(JSON.stringify(data)));
};

export const decodeProfile = (encodedString) => {
  try {
    if (typeof encodedString !== 'string' || encodedString.length === 0) {
      return null;
    }

    const json = decodeURIComponent(atob(encodedString));
    const parsed = JSON.parse(json);

    return parsed !== null && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};
