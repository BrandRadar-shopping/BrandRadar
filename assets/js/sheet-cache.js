window.BrandRadarSheets = window.BrandRadarSheets || {};

window.BrandRadarSheets.fetchWithCache = async function fetchWithCache(url, cacheKey, options = {}) {
  const maxAgeMs = options.maxAgeMs || 1000 * 60 * 60 * 24; // 24 timer
  const fullKey = `brandradar_sheet_cache_${cacheKey}`;

  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Sheet request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Sheet response was not an array");
    }

    localStorage.setItem(fullKey, JSON.stringify({
      timestamp: Date.now(),
      data
    }));

    return data;
  } catch (error) {
    console.warn("BrandRadar sheet fetch failed. Trying cache:", {
      url,
      cacheKey,
      error
    });

    const cached = localStorage.getItem(fullKey);
    if (!cached) throw error;

    const parsed = JSON.parse(cached);
    const age = Date.now() - Number(parsed.timestamp || 0);

    if (age > maxAgeMs) {
      console.warn("BrandRadar cached sheet data is old, but using it as emergency fallback:", cacheKey);
    }

    return parsed.data;
  }
};
