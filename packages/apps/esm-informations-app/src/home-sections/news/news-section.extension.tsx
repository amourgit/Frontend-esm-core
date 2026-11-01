import React from 'react';
import { showToast } from '@egen-civitas/esm-framework';
import { go } from '../shared/go';
import { BlogSection } from './blog-section.component';
import { blogArticles } from './news.data';

// Extension du slot `home-sections` : Actualités.
export default function NewsSectionExtension() {
  return (
    <BlogSection
      articles={blogArticles}
      onShowToast={(description, kind) => showToast({ kind, description })}
      onSeeAll={() => go('/informations/news')}
    />
  );
}
