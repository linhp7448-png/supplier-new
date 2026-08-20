(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ItemWorkflow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  var MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  var MAX_IMAGES = 5;

  function value(value) { return value == null ? '' : String(value).trim(); }

  function normalizeDomain(domain) {
    var map = { 'Kỹ thuật': 'Technical', 'Operations': 'Facilities' };
    return map[value(domain)] || value(domain) || 'F&B';
  }

  function capabilities(role, canonicalAvailable) {
    role = value(role) || 'Viewer';
    return {
      canSearch: true,
      canSubmit: !!canonicalAvailable && ['Buyer', 'Approver', 'Admin'].includes(role),
      canApprove: !!canonicalAvailable && ['Approver', 'Admin'].includes(role),
      canManageImages: !!canonicalAvailable && ['Approver', 'Admin'].includes(role)
    };
  }

  function vendorCode(input, vendors) {
    var raw = value(input);
    if (!raw) return '';
    var prefix = value(raw.split(/\s+[—-]\s+/)[0]).toUpperCase();
    var found = (vendors || []).find(function (vendor) {
      return value(vendor.code).toUpperCase() === prefix || value(vendor.name).toLowerCase() === raw.toLowerCase();
    });
    return found ? value(found.code) : '';
  }

  function classify(input) {
    if (input.mode === 'offer') return 'Add_Offer';
    if (input.mode === 'content') return 'Update_Content';
    if (value(input.replacedSubItemCode)) return 'Replace_Sub_Item';
    if (value(input.itemCode)) return 'Add_Sub_Item';
    return 'Create_Item';
  }

  function validate(input, item) {
    var errors = [];
    var type = classify(input);
    if (!value(input.requestedName)) errors.push('Cần nhập tên sản phẩm.');
    if (type === 'Create_Item' && !value(input.categoryCode)) errors.push('Item mới cần chọn Category để owner xác nhận.');
    if (type === 'Add_Offer') {
      if (!value(input.existingSubItemCode)) errors.push('Cần chọn Sub Item nhận Supplier Offer.');
      if (!value(input.vendorCode)) errors.push('Cần chọn nhà cung cấp đã có trong hệ thống.');
      return errors;
    }
    if (type === 'Update_Content') {
      if (!value(input.existingSubItemCode)) errors.push('Cần chọn Sub Item cần cập nhật content.');
      return errors;
    }
    if (!value(input.brand)) errors.push('Cần nhập brand/model.');
    if (!value(input.purchaseUom)) errors.push('Cần chọn đơn vị mua.');
    if (['gr', 'ml'].includes(value(input.purchaseUom).toLowerCase())) errors.push('Purchase UOM không được là gr hoặc ml.');
    if (!(Number(input.conversionFactor) > 0)) errors.push('Quy cách phải lớn hơn 0.');
    if (!value(input.baseUom)) errors.push('Cần chọn Base UOM.');
    if (item && value(item['Functional UOM']).toLowerCase() !== value(input.baseUom).toLowerCase()) {
      errors.push('Base UOM phải khớp Functional UOM của Item: ' + value(item['Functional UOM']));
    }
    return errors;
  }

  function approvalDecision(input, item) {
    var type = classify(input);
    var autoApproved = type === 'Add_Sub_Item' && !!item && !input.exactOnly
      && value(item['Functional UOM']).toLowerCase() === value(input.baseUom).toLowerCase()
      && value(item.Domain).toLowerCase() === normalizeDomain(input.domain).toLowerCase();
    if (type === 'Add_Offer') autoApproved = !!input.vendorCode && !!input.existingSubItemCode;
    return {
      requestType: type,
      autoApproved: autoApproved,
      reason: autoApproved
        ? 'Dùng master hiện hữu và không thay đổi functional specification.'
        : type === 'Replace_Sub_Item' ? 'Thay sản phẩm luôn cần Approver xác nhận.'
          : type === 'Create_Item' ? 'Item mới cần Category Owner xác nhận.'
            : type === 'Update_Content' ? 'Thay đổi Product Content cần kiểm soát.'
              : 'Có ngoại lệ cần owner xác nhận.'
    };
  }

  function validateImages(files) {
    var list = Array.from(files || []), errors = [];
    if (list.length > MAX_IMAGES) errors.push('Tối đa ' + MAX_IMAGES + ' ảnh cho một yêu cầu.');
    list.forEach(function (file) {
      if (!IMAGE_TYPES.includes(file.type)) errors.push(file.name + ': chỉ nhận JPG, PNG, WEBP hoặc GIF.');
      if (file.size > MAX_IMAGE_BYTES) errors.push(file.name + ': dung lượng vượt 5 MB.');
    });
    return errors;
  }

  function safeFileName(name) {
    return value(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  async function uploadImages(supabase, files, identity) {
    var list = Array.from(files || []), errors = validateImages(list);
    if (errors.length) throw new Error(errors.join(' '));
    var prefix = value(identity).toLowerCase().replace(/[^a-z0-9._-]/g, '_') || 'unknown';
    var batch = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36);
    var uploaded = [];
    for (var index = 0; index < list.length; index += 1) {
      var file = list[index];
      var path = 'items-mdm/' + prefix + '/' + batch + '/' + String(index + 1).padStart(2, '0') + '_' + safeFileName(file.name);
      var result = await supabase.storage.from('item_images').upload(path, file, { contentType: file.type, upsert: false });
      if (result.error) throw result.error;
      uploaded.push(path);
    }
    return uploaded;
  }

  function submissionKey() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'im-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  return {
    MAX_IMAGES: MAX_IMAGES,
    approvalDecision: approvalDecision,
    capabilities: capabilities,
    classify: classify,
    normalizeDomain: normalizeDomain,
    submissionKey: submissionKey,
    uploadImages: uploadImages,
    validate: validate,
    validateImages: validateImages,
    vendorCode: vendorCode
  };
});
