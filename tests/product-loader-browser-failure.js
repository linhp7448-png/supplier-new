(function () {
  'use strict';
  var originalCreate = window.supabase.createClient;
  function failingQuery() {
    var builder = {
      select: function () { return builder; },
      range: function () { return builder; },
      order: function () { return builder; },
      limit: function () { return builder; },
      eq: function () { return builder; },
      maybeSingle: function () { return builder; },
      then: function (resolve, reject) { return Promise.reject(new TypeError('Failed to fetch')).then(resolve, reject); }
    };
    return builder;
  }
  window.supabase.createClient = function () {
    var client = originalCreate();
    var originalFrom = client.from.bind(client);
    client.from = function (table) { return /^mdm_/.test(table) ? failingQuery() : originalFrom(table); };
    return client;
  };
})();
