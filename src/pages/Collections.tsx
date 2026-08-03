import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BookCard } from '../components/BookCard';
import { collectionService, type UserCollectionDTO } from '../services/collectionService';

const Collections: React.FC = () => {
  const [collections, setCollections] = useState<UserCollectionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [newColName, setNewColName] = useState('');
  const [activeColId, setActiveColId] = useState<number | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await collectionService.getCollections();
      setCollections(data);
      if (data.length > 0 && activeColId === null) {
        setActiveColId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      const newCol = await collectionService.createCollection(newColName.trim());
      setCollections([...collections, newCol]);
      setNewColName('');
      setActiveColId(newCol.id);
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const handleDeleteCollection = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) return;
    try {
      await collectionService.deleteCollection(id);
      setCollections(collections.filter(c => c.id !== id));
      if (activeColId === id) {
        setActiveColId(collections[0]?.id || null);
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const activeCollection = collections.find(c => c.id === activeColId);

  return (
    <div className="bg-surface text-on-surface min-h-screen relative overflow-x-hidden">
      <Navbar />
      <Sidebar />
      <main className="md:ml-sidebar-width pt-28 px-container-padding pb-section-gap max-w-[1440px] mx-auto min-h-screen">
        <section className="mb-10">
          <h1 className="font-headline-lg text-headline-lg mb-2 flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-4xl">collections_bookmark</span>
            My Collections
          </h1>
          <p className="text-on-surface-variant">Organize your reading journey into custom lists.</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar / List of collections */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <form onSubmit={handleCreateCollection} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                placeholder="New collection..." 
                className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50"
              />
              <button type="submit" className="bg-primary/10 text-primary p-2 rounded-xl hover:bg-primary/20">
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </form>
            
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-surface-container rounded-xl" />)}
              </div>
            ) : (
              collections.map(col => (
                <div 
                  key={col.id} 
                  onClick={() => setActiveColId(col.id)}
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${activeColId === col.id ? 'bg-primary/10 border-primary/30 border' : 'bg-surface-container-low hover:bg-surface-container'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="material-symbols-outlined text-primary/70 text-[20px]">
                      {col.isSystem ? 'bookmark_star' : 'folder'}
                    </span>
                    <span className="font-semibold text-sm truncate">{col.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-surface-container-highest px-2 py-0.5 rounded-full">{col.books.length}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Collection Details */}
          <div className="md:col-span-3">
            {activeCollection ? (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-8 min-h-[500px]">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/20">
                  <div>
                    <h2 className="text-2xl font-bold text-on-surface flex items-center gap-3">
                      {activeCollection.name}
                      {activeCollection.isSystem && (
                        <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">System</span>
                      )}
                    </h2>
                    <p className="text-sm text-on-surface-variant mt-1">
                      {activeCollection.books.length} books in this collection
                    </p>
                  </div>
                  {!activeCollection.isSystem && (
                    <button 
                      onClick={() => handleDeleteCollection(activeCollection.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Delete
                    </button>
                  )}
                </div>

                {activeCollection.books.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                    <span className="material-symbols-outlined text-6xl mb-4">menu_book</span>
                    <p className="text-lg font-semibold">This collection is empty</p>
                    <p className="text-sm">Browse books and add them to your collection.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeCollection.books.map(book => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant opacity-50">
                Select or create a collection to view its books.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Collections;
