
-- Table to store ebook products for tracking
CREATE TABLE public.ebook_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  topic text NOT NULL,
  description text,
  length text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'published',
  current_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ebook_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products"
  ON public.ebook_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON public.ebook_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.ebook_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.ebook_products FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_ebook_products_updated_at
  BEFORE UPDATE ON public.ebook_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table to store product versions
CREATE TABLE public.product_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.ebook_products(id) ON DELETE CASCADE,
  version_number int NOT NULL DEFAULT 1,
  content text NOT NULL,
  cover_image_url text,
  pages int NOT NULL DEFAULT 0,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their products"
  ON public.product_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ebook_products WHERE id = product_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert versions for their products"
  ON public.product_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ebook_products WHERE id = product_id AND user_id = auth.uid()
  ));

-- Table to store product metrics
CREATE TABLE public.product_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.ebook_products(id) ON DELETE CASCADE,
  metric_type text NOT NULL, -- 'view', 'download', 'share', 'click'
  value int NOT NULL DEFAULT 1,
  metadata jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics for their products"
  ON public.product_metrics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ebook_products WHERE id = product_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert metrics for their products"
  ON public.product_metrics FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ebook_products WHERE id = product_id AND user_id = auth.uid()
  ));

-- Table to store user feedback
CREATE TABLE public.product_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.ebook_products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating int CHECK (rating >= 1 AND rating <= 5),
  comment text,
  section_reference text, -- e.g. 'chapter_3'
  feedback_type text NOT NULL DEFAULT 'general', -- 'general', 'chapter', 'suggestion'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedback on their products"
  ON public.product_feedback FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.ebook_products WHERE id = product_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert feedback"
  ON public.product_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.product_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.product_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Add foreign key for current_version_id after product_versions exists
ALTER TABLE public.ebook_products
  ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id) REFERENCES public.product_versions(id);

-- Indexes for performance
CREATE INDEX idx_product_metrics_product_id ON public.product_metrics(product_id);
CREATE INDEX idx_product_metrics_type ON public.product_metrics(metric_type);
CREATE INDEX idx_product_feedback_product_id ON public.product_feedback(product_id);
CREATE INDEX idx_product_versions_product_id ON public.product_versions(product_id);
