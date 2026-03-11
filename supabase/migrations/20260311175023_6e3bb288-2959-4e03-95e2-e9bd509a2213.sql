
-- Create client_attachments table
CREATE TABLE public.client_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view attachments of their company"
  ON public.client_attachments FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

CREATE POLICY "Users can upload attachments"
  ON public.client_attachments FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete own attachments or admins"
  ON public.client_attachments FOR DELETE TO authenticated
  USING (
    (uploaded_by = auth.uid() AND company_id = get_user_company_id(auth.uid()))
    OR (is_admin() AND company_id = get_user_company_id(auth.uid()))
    OR is_super_admin()
  );

-- Indexes
CREATE INDEX idx_client_attachments_client_id ON public.client_attachments(client_id);
CREATE INDEX idx_client_attachments_company_id ON public.client_attachments(company_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-attachments',
  'client-attachments',
  false,
  20971520,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload client attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-attachments');

CREATE POLICY "Authenticated users can view client attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-attachments');

CREATE POLICY "Users can delete own client attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-attachments');
