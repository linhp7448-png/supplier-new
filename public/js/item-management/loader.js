(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ItemLoader = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function errorMessage(error) {
    if (!error) return 'Unknown data error';
    if (typeof error === 'string') return error;
    return error.message || error.details || error.hint || String(error);
  }

  function isRetryable(error) {
    return /(failed to fetch|network|load failed|timeout|timed out|connection|fetch failed)/i.test(errorMessage(error));
  }

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function queryWithRetry(task, options) {
    options = options || {};
    var attempts = Math.max(1, Number(options.attempts || 2));
    var delayMs = Math.max(0, Number(options.delayMs || 0));
    var lastResult = null, lastError = null;
    for (var attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        var result = await task(attempt);
        lastResult = result;
        if (!result || !result.error || !isRetryable(result.error) || attempt === attempts) return result;
      } catch (error) {
        lastError = error;
        if (!isRetryable(error) || attempt === attempts) throw error;
      }
      if (delayMs) await delay(delayMs * attempt);
    }
    if (lastResult) return lastResult;
    throw lastError || new Error('Query failed');
  }

  function validateCatalog(data) {
    if (!data || !Array.isArray(data.items) || !Array.isArray(data.subItems) || !Array.isArray(data.offers)) {
      throw new Error('Local product catalog has an invalid structure');
    }
    if (!data.items.length || !data.subItems.length) {
      throw new Error('Local product catalog is empty');
    }
    return data;
  }

  async function loadCatalog(fetcher, url) {
    var response = await fetcher(url, { cache: 'no-store' });
    if (!response || response.ok === false) {
      throw new Error('Local product catalog returned HTTP ' + (response ? response.status : 'unknown'));
    }
    return validateCatalog(await response.json());
  }

  function projectRef(url) {
    var match = String(url || '').match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
    return match ? match[1] : 'unknown-project';
  }

  return {
    errorMessage: errorMessage,
    isRetryable: isRetryable,
    queryWithRetry: queryWithRetry,
    validateCatalog: validateCatalog,
    loadCatalog: loadCatalog,
    projectRef: projectRef
  };
});
