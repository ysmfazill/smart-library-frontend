const fs = require('fs');

const generateBooks = () => {
  const books = [];
  const categories = ['Artificial Intelligence', 'Machine Learning', 'Data Science', 'Philosophy', 'Science', 'Business', 'Web Development'];
  const authors = ['Dr. Sarah Vance', 'Alan Turing III', 'Gene Hacker', 'S. Schrodinger', 'Ada Lovelace Jr', 'Elon M.', 'Nikola T.'];
  
  for (let i = 1; i <= 40; i++) {
    const category = categories[i % categories.length];
    const author = authors[i % authors.length];
    const rating = (3.5 + (Math.random() * 1.5)).toFixed(1);
    
    books.push(`  {
    id: '${i}',
    title: 'Placeholder Book Title ${i}',
    author: '${author}',
    cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXBOCte-y-7SEBz3oRgIWXzWg_8agIpIZJV8Ud2Twwnu0zYjKxLNMYXsUnZN66cZfNe9SujbqxII3A3qZ5BaJKupS-yM0uS2_hDmI6BtYs5clXJ_lDROjZqPM-iwMUFujxazT5iWsr4BgwAzH-xv-9HM3X1W_hOtdH3d7SkxQRTsWr4dqsv6IszkzKXT7aNAmHkJ44OM173zEtVBtmpYD7VnRQv1Nwnw_dFn-mWdpgF5QdlV0ohsg',
    rating: ${rating},
    category: '${category}',
    matchPercent: ${Math.floor(70 + Math.random() * 30)},
    description: 'This is a detailed description for book ${i}. It explores the profound implications of ${category.toLowerCase()} and how it intersects with modern technology.',
    publicationYear: ${2015 + Math.floor(Math.random() * 9)},
    language: 'English',
    pages: ${200 + Math.floor(Math.random() * 400)},
    aiSummary: 'A comprehensive guide on ${category}. Key takeaways include practical applications and ethical considerations.',
    keywords: ['${category.split(' ')[0].toLowerCase()}', 'technology', 'future'],
    similarBooks: ['${Math.floor(Math.random() * 40) + 1}', '${Math.floor(Math.random() * 40) + 1}']
  }`);
  }
  return books.join(',\n');
};

const fileContent = `import type { Interest, Book } from '../types';

export const INTERESTS: Interest[] = [
  { id: 1, name: 'Artificial Intelligence', icon: 'neurology', desc: 'Neural networks, LLMs, and ethics.' },
  { id: 2, name: 'Machine Learning', icon: 'memory', desc: 'Algorithms and predictive modeling.' },
  { id: 3, name: 'Data Science', icon: 'database', desc: 'Big data, analytics, and visualization.' },
  { id: 4, name: 'Java Programming', icon: 'terminal', desc: 'Enterprise development and JVM.' },
  { id: 5, name: 'Python', icon: 'code', desc: 'Scripting, automation, and science.' },
  { id: 6, name: 'Web Development', icon: 'html', desc: 'Full-stack, React, and modern CSS.' },
  { id: 7, name: 'Cyber Security', icon: 'shield_lock', desc: 'Ethical hacking and network defense.' },
  { id: 8, name: 'Cloud Computing', icon: 'cloud', desc: 'AWS, Azure, and infrastructure.' },
  { id: 9, name: 'Mobile App Dev', icon: 'smartphone', desc: 'iOS, Android, and Flutter.' },
  { id: 10, name: 'UI/UX Design', icon: 'palette', desc: 'Product design and user research.' },
  { id: 11, name: 'Business', icon: 'business_center', desc: 'Strategy and corporate growth.' },
  { id: 12, name: 'Entrepreneurship', icon: 'rocket_launch', desc: 'Startups and building ventures.' },
  { id: 13, name: 'Finance', icon: 'payments', desc: 'Markets, personal finance, and crypto.' },
  { id: 14, name: 'Marketing', icon: 'campaign', desc: 'Branding and digital advertising.' },
  { id: 15, name: 'Self Help', icon: 'psychology_alt', desc: 'Personal growth and mindset.' },
  { id: 16, name: 'Productivity', icon: 'timer', desc: 'Time management and workflows.' },
  { id: 17, name: 'Science', icon: 'science', desc: 'Physics, biology, and the universe.' },
  { id: 18, name: 'History', icon: 'history_edu', desc: 'Past civilizations and events.' },
  { id: 19, name: 'Biography', icon: 'person_book', desc: 'Stories of influential lives.' },
  { id: 20, name: 'Fantasy', icon: 'auto_fix_high', desc: 'Magic systems and world building.' },
  { id: 21, name: 'Mystery', icon: 'search_check', desc: 'Thrillers and investigative plots.' },
  { id: 22, name: 'Romance', icon: 'favorite', desc: 'Relationships and emotional journeys.' },
  { id: 23, name: 'Horror', icon: 'dark_mode', desc: 'Supernatural and psychological fear.' },
  { id: 24, name: 'Health & Fitness', icon: 'fitness_center', desc: 'Nutrition and physical wellness.' },
  { id: 25, name: 'Psychology', icon: 'psychology', desc: 'Behavior and the human mind.' },
];

export const RECOMMENDED_BOOKS: Book[] = [
${generateBooks()}
];

export const CONTINUE_READING_BOOKS: Book[] = [
  {
    id: 'cr1',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSKnVEonpoF6piegl0bPhaNO2LWaQM-_i6xNfd-ku0CvEMveKhTMA_henqf3GgcsTV4qiHCYkgB25vmAuVkMeeHLqQ4iXR1ESObpU1gh_-w6BLfwrFSmS8E69u7eooxTjfjkIsTx92TqXnVsXPC6SlepfgnF_jjMsGuz2uePIioMjKW789R1qDtn_kP_lIxGgT_GEwtnnAJ7ZAxc_ELgfZTYiqj64L-3Ml-QbFaP6CzRgNyhcgWIk',
    rating: 4.8,
    category: 'Programming',
    progress: 65,
  },
  {
    id: 'cr2',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVJku5rabZRa7zLwtApR_MpJ7ma_ETaTXkAFIR5bfqtrdyn-Q6Rgh0tqo1gfvpfwZ-dGAPTLWGpuwv__VuwRZEuQKq4YvcOccHNe0kxsIqXK54d2if-s_wb-ZMAiTv-fDkQpyhsYp4GIj5Py9_yUH4u4dwQpifx6HGxnptcsdGvoqT6wBzIhTTw4M2X8d3DJPoETTlPVG1IwfkgG25kpX2fYYZhfKoW2YVhUAndLwrEJghLfWbRLU',
    rating: 4.7,
    category: 'Self Help',
    progress: 30,
  },
];
`;

fs.writeFileSync('src/utils/placeholderData.ts', fileContent);
console.log('Successfully generated placeholderData.ts');
