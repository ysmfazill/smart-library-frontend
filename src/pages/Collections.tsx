import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
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

  const safeCollections = Array.isArray(collections) ? collections.filter(Boolean) : [];

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      const newCol = await collectionService.createCollection(newColName.trim());
      setCollections([...safeCollections, newCol]);
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
      setCollections(safeCollections.filter(c => c.id !== id));
      if (activeColId === id) {
        setActiveColId(safeCollections[0]?.id || null);
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const activeCollection = safeCollections.find(c => c.id === activeColId);
  const activeBooks = Array.isArray(activeCollection?.books) ? activeCollection.books.filter(Boolean) : [];

  return (
    <AppLayout>
            <section className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2 sm:gap-3 text-primary">
                <span className="material-symbols-outlined text-2xl sm:text-4xl">collections_bookmark</span>
                My Collections
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant">Organize your reading journey into custom lists.</p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Sidebar / List of collections */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <form onSubmit={handleCreateCollection} className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    placeholder="New collection..." 
                    className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-primary/50 min-h-[40px]"
                  />
                  <button type="submit" className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary-container min-h-[40px] min-w-[40px] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                </form>
                
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    {[1,2,3,4].map(i => <div key={i} className="h-12 bg-surface-container rounded-xl" />)}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-60 lg:max-h-none overflow-y-auto custom-scrollbar">
                    {safeCollections.map(col => {
                      const count = Array.isArray(col.books) ? col.books.length : 0;
                      return (
                        <div 
                          key={col.id} 
                          onClick={() => setActiveColId(col.id)}
                          className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-colors min-h-[44px] ${activeColId === col.id ? 'bg-primary/10 border-primary/30 border font-semibold' : 'bg-surface-container-low hover:bg-surface-container'}`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="material-symbols-outlined text-primary/70 text-[20px]">
                              {col.isSystem ? 'bookmark_star' : 'folder'}
                            </span>
                            <span className="text-xs sm:text-sm truncate">{col.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] sm:text-xs bg-surface-container-highest px-2 py-0.5 rounded-full font-bold">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Collection Details */}
              <div className="lg:col-span-3">
                {activeCollection ? (
                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 sm:p-6 lg:p-8 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/20 gap-4 flex-wrap">
                      <div>
                        <h2 className="text-lg sm:text-2xl font-bold text-on-surface flex items-center gap-2">
                          {activeCollection.name}
                          {activeCollection.isSystem && (
                            <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">System</span>
                          )}
                        </h2>
                        <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                          {activeBooks.length} books in this collection
                        </p>
                      </div>
                      {!activeCollection.isSystem && (
                        <button 
                          onClick={() => handleDeleteCollection(activeCollection.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-semibold min-h-[40px]"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          Delete
                        </button>
                      )}
                    </div>

                    {activeBooks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center opacity-70">
                        <span className="material-symbols-outlined text-5xl mb-3">menu_book</span>
                        <p className="text-base font-semibold">This collection is empty</p>
                        <p className="text-xs sm:text-sm">Browse books and add them to your collection.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {activeBooks.map(book => (
                          <BookCard key={book.id} book={book} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-on-surface-variant opacity-50 text-xs sm:text-sm">
                    Select or create a collection to view its books.
                  </div>
                )}
              </div>
            </div>
    </AppLayout>
  );
};

export default Collections;
