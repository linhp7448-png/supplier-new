-- Tạo bảng vendor_audit (Nhật ký thao tác)
CREATE TABLE IF NOT EXISTS public.vendor_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendor(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    by_email TEXT,
    note TEXT,
    at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo bảng vendor_bank_change (Yêu cầu thay đổi tài khoản ngân hàng)
CREATE TABLE IF NOT EXISTS public.vendor_bank_change (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendor(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    branch TEXT,
    account_no TEXT NOT NULL,
    account_holder TEXT,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    requested_by TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    decided_by TEXT,
    decided_at TIMESTAMPTZ,
    decision_note TEXT
);

-- Cho phép đọc/ghi thoải mái (do app của bạn quản lý quyền qua frontend)
ALTER TABLE public.vendor_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_bank_change ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả trên vendor_audit" ON public.vendor_audit FOR ALL USING (true);
CREATE POLICY "Cho phép tất cả trên vendor_bank_change" ON public.vendor_bank_change FOR ALL USING (true);