#!/usr/bin/env tsx

/**
 * Insert hierarchical categories into MongoDB
 * Usage: tsx scripts/insert-categories.ts
 */

import mongoose from 'mongoose';
import { Category } from '../src/models/Category';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

// Helper function to create category nodes
function node(
  taxonomy: string,
  name: string,
  slug: string,
  order: number,
  kind: string,
  description = '',
  parentSlug: string | null = null
) {
  return {
    taxonomy,
    name,
    slug,
    order,
    kind,
    description,
    parentSlug,
  };
}

// Category definitions
const type = [
  node('type', 'Stotra (Hymns / Prayers)', 'stotra', 0, 'category', 'Hymns / prayers'),
  node('type', 'Atharvashirsha', 'atharvashirsha', 0, 'item', ''),
  node('type', 'Aksharamala', 'aksharamala', 1, 'item', 'Garland of Letters'),
  node('type', 'Aparadha Kshama', 'aparadha-kshama', 2, 'item', 'Forgiveness of Offenses'),
  node('type', 'Kavacha', 'kavacha', 3, 'item', 'Protective Hymns / Armor Prayers'),
  node('type', 'Bhujanga', 'bhujanga', 4, 'item', 'Meter of composition, serpent-like hymns'),
  node('type', 'Mala Mantra', 'mala-mantra', 5, 'item', 'Garland of Mantras'),
  node('type', 'Mantra', 'mantra', 6, 'item', 'Sacred Chants'),
  node('type', 'Raksha', 'raksha', 7, 'item', 'Protection Hymns'),
  node('type', 'Lahari', 'lahari', 8, 'item', 'Waves; e.g., Soundarya Lahari'),
  node('type', 'Varnamala', 'varnamala', 9, 'item', 'Garland of Alphabets'),
  node('type', 'Suprabhata', 'suprabhata', 10, 'item', 'Morning Hymns'),
  node('type', 'Sukta', 'sukta', 11, 'item', 'Sacred Vedic Hymns'),
  node('type', 'Sutra', 'sutra', 12, 'item', 'Aphorisms / Threads of Wisdom'),
  node('type', 'Stotra', 'stotra-generic', 13, 'item', 'Hymn of Praise'),
  node('type', 'Stavaraja', 'stavaraja', 14, 'item', 'King of Hymns / Great Hymn'),
  node('type', 'Hridaya', 'hridaya', 15, 'item', 'Heart Hymns (e.g., Shiva/Vishnu Hridaya)'),
  node(
    'type',
    'Ashtottara Shatanama Stotra',
    'ashtottara-shatanama-stotra',
    16,
    'item',
    '108 Names Hymn'
  ),
  node('type', 'Sahasranama Stotra', 'sahasranama-stotra', 17, 'item', '1000 Names Hymn'),
  node('type', 'Dwadashanama Stotra', 'dwadashanama-stotra', 18, 'item', '12 Names Hymn'),

  node('type', 'Namavali', 'namavali', 1, 'category', 'Name-lists'),
  node(
    'type',
    'Ashtottara Shatanamavali',
    'ashtottara-shatanamavali',
    0,
    'item',
    '108 Names – List',
    'namavali'
  ),
  node('type', 'Dwadasha Namavali', 'dwadasha-namavali', 1, 'item', '12 Names – List', 'namavali'),
  node('type', 'Trishatinamavali', 'trishatinamavali', 2, 'item', '300 Names – List', 'namavali'),
  node('type', 'Sahasranamavali', 'sahasranamavali', 3, 'item', '1000 Names – List', 'namavali'),
  node('type', 'Others', 'others', 4, 'item', 'Other name-lists', 'namavali'),
];

// Set parent relationships for Type categories
for (let i = 1; i <= 18; i++) {
  type[i].parentSlug = 'stotra';
}

const byNumber = [
  node('by-number', 'By Numbers', 'by-numbers', 0, 'category', 'Kramankaanusaarena'),
  node('by-number', 'Ekashloki', '1-ekashloki', 0, 'item', 'Single Verse', 'by-numbers'),
  node('by-number', 'Panchaka', '5-panchaka', 1, 'item', 'Group of Five', 'by-numbers'),
  node('by-number', 'Pancharatna', '5-pancharatna', 2, 'item', 'Five Gems', 'by-numbers'),
  node('by-number', 'Shatka', '6-shatka', 3, 'item', 'Six', 'by-numbers'),
  node('by-number', 'Shatpadi', '6-shatpadi', 4, 'item', 'Six Verses', 'by-numbers'),
  node('by-number', 'Saptaka', '7-saptaka', 5, 'item', 'Seven', 'by-numbers'),
  node('by-number', 'Ashtaka', '8-ashtaka', 6, 'item', 'Eight', 'by-numbers'),
  node('by-number', 'Nava', '9-nava', 7, 'item', 'Nine', 'by-numbers'),
  node('by-number', 'Dashaka', '10-dashaka', 8, 'item', 'Ten', 'by-numbers'),
  node('by-number', 'Shodasha', '16-shodasha', 9, 'item', 'Sixteen', 'by-numbers'),
  node('by-number', 'Vimshati', '20-vimshati', 10, 'item', 'Twenty', 'by-numbers'),
  node('by-number', 'Shataka', '100-shataka', 11, 'item', 'Hundred', 'by-numbers'),
  node(
    'by-number',
    'Ashtottara Shatanama Stotra',
    '108-ashtottara-shatanama-stotra',
    12,
    'item',
    '108 Names Hymn',
    'by-numbers'
  ),
  node(
    'by-number',
    'Ashtottara Shatanamavali',
    '108-ashtottara-shatanamavali',
    13,
    'item',
    '108 Names – List',
    'by-numbers'
  ),
  node(
    'by-number',
    'Trishatinamavali',
    '300-trishatinamavali',
    14,
    'item',
    'Three Hundred Names – List',
    'by-numbers'
  ),
  node(
    'by-number',
    'Trishati / Panchashati / Saptashati',
    '300-500-700',
    15,
    'item',
    '300/500/700 Verses',
    'by-numbers'
  ),
  node(
    'by-number',
    'Sahasranama Stotra',
    '1000-sahasranama-stotra',
    16,
    'item',
    '1000 Names Hymn',
    'by-numbers'
  ),
  node(
    'by-number',
    'Sahasranamavali',
    '1000-sahasranamavali',
    17,
    'item',
    '1000 Names – List',
    'by-numbers'
  ),
  node(
    'by-number',
    'Namavali (All Name-Lists)',
    'namavali-all',
    18,
    'item',
    'All Name-Lists',
    'by-numbers'
  ),
];

const deva = [
  node('deva', 'Deva (Gods)', 'deva', 0, 'category', 'By deities'),
  node('deva', 'Ganesha', 'ganesha', 0, 'item', '', 'deva'),
  node('deva', 'Devi (Goddess)', 'devi', 1, 'category', '', 'deva'),
  node('deva', 'Annapurna', 'annapurna', 0, 'item', '', 'devi'),
  node('deva', 'Durga', 'durga', 1, 'item', '', 'devi'),
  node('deva', 'Parvati', 'parvati', 2, 'item', '', 'devi'),
  node('deva', 'Lakshmi', 'lakshmi', 3, 'item', '', 'devi'),
  node('deva', 'Saraswati', 'saraswati', 4, 'item', '', 'devi'),
  node('deva', 'Lalita', 'lalita', 5, 'item', '', 'devi'),
  node(
    'deva',
    'Dashamahavidya',
    'dashamahavidya',
    6,
    'item',
    'Kali, Tara, Maha Tripura Sundari, Bhuvaneshwari, Chinnamasta, Bhairavi, Dhumavati, Bagalamukhi, Matangi, Kamala',
    'devi'
  ),
  node('deva', 'Shatchakrashakti', 'shatchakrashakti', 7, 'item', 'Power of Six Chakras', 'devi'),
  node('deva', 'Kamakshi', 'kamakshi', 8, 'item', '', 'devi'),
  node('deva', 'Gayatri', 'gayatri', 9, 'item', '', 'devi'),
  node('deva', 'Tulasi', 'tulasi', 10, 'item', 'Sacred Basil', 'devi'),
  node('deva', 'Meenakshi', 'meenakshi', 11, 'item', '', 'devi'),
  node('deva', 'Radha', 'radha', 12, 'item', '', 'devi'),
  node('deva', 'Renuka', 'renuka', 13, 'item', '', 'devi'),
  node('deva', 'Devi Anyarupa', 'devi-anyarupa', 14, 'item', 'Other Forms of Devi', 'devi'),
  node('deva', 'Nadi', 'nadi', 15, 'item', 'River Goddesses', 'devi'),
  node(
    'deva',
    'Sarva Devi Avatara',
    'sarva-devi-avatara',
    16,
    'item',
    'All Devi – Alphabetical',
    'devi'
  ),

  node('deva', 'Vishnu', 'vishnu', 2, 'category', '', 'deva'),
  node('deva', 'Rama', 'rama', 0, 'item', '', 'vishnu'),
  node('deva', 'Krishna', 'krishna', 1, 'item', '', 'vishnu'),
  node('deva', 'Dashavatara', 'dashavatara', 2, 'item', 'Ten Incarnations', 'vishnu'),
  node('deva', 'Venkateshwara', 'venkateshwara', 3, 'item', '', 'vishnu'),
  node(
    'deva',
    'Vishnu Anya Avatara',
    'vishnu-anya-avatara',
    4,
    'item',
    'Other Avatars of Vishnu',
    'vishnu'
  ),
  node(
    'deva',
    'Sarva Vishnu Avatara',
    'sarva-vishnu-avatara',
    5,
    'item',
    'All Vishnu – Alphabetical',
    'vishnu'
  ),

  node('deva', 'Shiva', 'shiva', 3, 'item', '', 'deva'),
  node('deva', 'Subrahmanya (Kartikeya / Murugan)', 'subrahmanya', 4, 'item', '', 'deva'),
  node('deva', 'Hanuman', 'hanuman', 5, 'item', '', 'deva'),
  node('deva', 'Navagraha', 'navagraha', 6, 'item', 'Nine Planets / Deities', 'deva'),
  node('deva', 'Anya Devata', 'anya-devata', 7, 'category', 'Other Deities', 'deva'),
  node('deva', 'Ayyappa', 'ayyappa', 0, 'item', '', 'anya-devata'),
  node('deva', 'Dattatreya', 'dattatreya', 1, 'item', '', 'anya-devata'),
  node('deva', 'Gurudev', 'gurudev', 2, 'item', 'Guru considered Divine', 'anya-devata'),
  node(
    'deva',
    'Sarva Anya Devata',
    'sarva-anya-devata',
    3,
    'item',
    'All Other Deities – Alphabetical',
    'anya-devata'
  ),
];

const allCategories = [...type, ...byNumber, ...deva];

async function insertCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    console.log('🗑️  Clearing existing categories...');
    await Category.deleteMany({});

    console.log('📦 Processing categories...');

    const slugToIdMap = new Map<string, string>();
    const categoryDocs = [];

    // Create all category documents
    for (const rawCategory of allCategories) {
      const categoryDoc = new Category({
        name: {
          en: rawCategory.name,
          te: rawCategory.name,
        },
        slug: {
          en: rawCategory.slug,
          te: rawCategory.slug,
        },
        description: rawCategory.description
          ? {
              en: rawCategory.description,
              te: rawCategory.description,
            }
          : undefined,
        order: rawCategory.order,
        isActive: true,
        meta: {
          taxonomy: rawCategory.taxonomy,
          kind: rawCategory.kind,
          parentSlug: rawCategory.parentSlug,
        },
        createdBy: 'system',
      });

      categoryDocs.push(categoryDoc);
    }

    console.log('💾 Inserting documents...');
    const savedDocs = await Category.insertMany(categoryDocs);

    // Build slug to ID mapping
    for (let i = 0; i < savedDocs.length; i++) {
      const slug = allCategories[i].slug;
      slugToIdMap.set(slug, savedDocs[i].id);
    }

    console.log('🔗 Setting up parent relationships...');

    // Update parent references
    for (let i = 0; i < allCategories.length; i++) {
      const rawCategory = allCategories[i];
      if (rawCategory.parentSlug) {
        const parentId = slugToIdMap.get(rawCategory.parentSlug);
        if (parentId) {
          await Category.findByIdAndUpdate(savedDocs[i].id, {
            parent: parentId,
          });
        }
      }
    }

    console.log('✅ Categories inserted successfully!');

    // Show summary
    const rootCategories = await Category.find({ parent: null });
    const totalCategories = await Category.countDocuments();

    console.log(`\n📊 Summary:`);
    console.log(`   Total categories: ${totalCategories}`);
    console.log(`   Root categories: ${rootCategories.length}`);

    console.log(`\n🌳 Root categories:`);
    for (const root of rootCategories) {
      const childCount = await Category.countDocuments({ parent: root.id });
      console.log(`   - ${root.name.en} (${childCount} children)`);
    }

    console.log(`\n🔍 MongoDB Admin UI: http://localhost:8082`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

insertCategories();
