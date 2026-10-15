import { createDirectus, rest } from '@directus/sdk';

type Global = {
  title: string;
  description: string;
}

type Author = {
  name: string
}

type Page = {
  title: string;
  content: string;
  slug: string;
} 

type Post = {
  image: string;
  title: string;
  author: Author;
  content: string;
  published_date: string
  slug: string;
}

type Categorie = {
  title: string
}

type Projects = {
  title: string;
  Image: string;
  description: string;
  categorie: Categorie;
  link: string;
  slug: string;
}

type Schema = {
  posts: Post[];
  global: Global;
  pages: Page[];
  projects: Projects[];
  categories: Categorie[];
}

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL;

const directus = createDirectus<Schema>(DIRECTUS_URL).with(rest());

export default directus;
