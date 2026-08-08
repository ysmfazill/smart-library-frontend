import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { adminService } from '../services/adminService';
import { categoryService } from '../services/categoryService';
import type { BookPreview, ImportSummary } from '../services/adminService';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'books' | 'import'>('dashboard');

  // Real API states
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [recommendationStats, setRecommendationStats] = useState<any>({});
  const [popularCategories, setPopularCategories] = useState<any[]>([]);
  const [popularAuthors, setPopularAuthors] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [booksList, setBooksList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [bookPage, setBookPage] = useState(0);
  const [bookTotalPages, setBookTotalPages] = useState(1);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [importHistoryList, setImportHistoryList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Single Book Add/Edit Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | string | null>(null);
  const [savingBook, setSavingBook] = useState(false);
  const [bookModalError, setBookModalError] = useState<string | null>(null);
  const [bookFormData, setBookFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    categoryId: 1,
    language: 'English',
    publicationYear: new Date().getFullYear(),
    pages: 300,
    keywords: '',
    coverImage: '',
    totalCopies: 1,
  });
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch dashboard, users, and import history
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoadingData(true);
      try {
        if (activeTab === 'dashboard') {
          const [dashboard, recStats, cats, authors] = await Promise.all([
            adminService.getDashboard(),
            adminService.getRecommendationStats(),
            adminService.getPopularCategories(),
            adminService.getPopularAuthors()
          ]);
          if (mounted) {
            setDashboardStats(dashboard?.data || dashboard || {});
            setRecommendationStats(recStats?.data || recStats || {});
            setPopularCategories(cats?.data || cats || []);
            setPopularAuthors(authors?.data || authors || []);
          }
        } else if (activeTab === 'users') {
          const res = await adminService.getUsers();
          const list = res?.data || res;
          if (mounted) setUsersList(Array.isArray(list) ? list : list?.content || []);
        } else if (activeTab === 'import') {
          const res = await adminService.getImportHistory(0, 50);
          const list = res?.data || res;
          if (mounted) setImportHistoryList(Array.isArray(list) ? list : list?.content || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoadingData(false);
      }
    };
    if (activeTab !== 'books') {
      loadData();
    }
    return () => { mounted = false; };
  }, [activeTab]);

  // Reset page when search query changes
  useEffect(() => {
    setBookPage(0);
  }, [bookSearchQuery]);

  // Fetch categories on mount
  useEffect(() => {
    categoryService.getAllCategories().then(res => {
      const cats = res?.data || res || [];
      if (Array.isArray(cats)) setCategoriesList(cats);
    }).catch(console.error);
  }, []);

  const refreshBooks = async () => {
    setLoadingData(true);
    try {
      const res = await adminService.getAdminBooks(bookPage, 10, bookSearchQuery);
      const data = res?.data || res;
      setBooksList(Array.isArray(data) ? data : data?.content || []);
      setBookTotalPages(data?.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch books separately for search and pagination
  useEffect(() => {
    if (activeTab === 'books') {
      const debounceTimer = setTimeout(() => {
        refreshBooks();
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [activeTab, bookPage, bookSearchQuery]);

  const openAddBookModal = () => {
    setEditingBookId(null);
    setBookModalError(null);
    setBookFormData({
      title: '',
      author: '',
      isbn: '',
      description: '',
      categoryId: categoriesList[0]?.id || 1,
      language: 'English',
      publicationYear: new Date().getFullYear(),
      pages: 300,
      keywords: '',
      coverImage: '',
      totalCopies: 1,
    });
    setSelectedPdfFile(null);
    setIsBookModalOpen(true);
  };

  const openEditBookModal = (book: any) => {
    setEditingBookId(book.id);
    setBookModalError(null);
    setBookFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      description: book.description || '',
      categoryId: book.category?.id || book.categoryId || categoriesList[0]?.id || 1,
      language: book.language || 'English',
      publicationYear: book.publicationYear || new Date().getFullYear(),
      pages: book.pages || 300,
      keywords: Array.isArray(book.keywords) ? book.keywords.join(', ') : (book.keywords || ''),
      coverImage: book.coverImage || '',
      totalCopies: book.totalCopies || 1,
    });
    setSelectedPdfFile(null);
    setIsBookModalOpen(true);
  };

  const handleDeleteBook = async (bookId: number | string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await adminService.deleteBook(bookId);
      await refreshBooks();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete book');
    }
  };

  const handleSaveBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFormData.title || !bookFormData.author) {
      setBookModalError('Title and Author are required fields.');
      return;
    }

    setSavingBook(true);
    setBookModalError(null);

    try {
      let savedBook: any;
      const payload = {
        title: bookFormData.title,
        author: bookFormData.author,
        isbn: bookFormData.isbn || null,
        description: bookFormData.description,
        categoryId: Number(bookFormData.categoryId),
        language: bookFormData.language,
        publicationYear: Number(bookFormData.publicationYear),
        pages: Number(bookFormData.pages),
        keywords: bookFormData.keywords,
        coverImage: bookFormData.coverImage || null,
        totalCopies: Number(bookFormData.totalCopies),
      };

      if (editingBookId) {
        const res = await adminService.updateBook(editingBookId, payload);
        savedBook = res?.data || res;
      } else {
        const res = await adminService.createBook(payload);
        savedBook = res?.data || res;
      }

      const bookId = savedBook?.id || editingBookId;

      // Upload digital PDF file if selected
      if (selectedPdfFile && bookId) {
        await adminService.uploadBookFile(bookId, selectedPdfFile);
      }

      setIsBookModalOpen(false);
      setSelectedPdfFile(null);
      await refreshBooks();
    } catch (err: any) {
      console.error('Failed to save book:', err);
      setBookModalError(err?.response?.data?.message || 'Failed to save book. Please check fields and try again.');
    } finally {
      setSavingBook(false);
    }
  };

  // Excel Import States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [previewRows, setPreviewRows] = useState<BookPreview[] | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(
      f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );
    if (valid.length === 0) {
      setErrorMsg('Please select valid Excel files (.xlsx or .xls)');
      return;
    }
    setErrorMsg(null);
    setSelectedFiles(prev => [...prev, ...valid]);
    setPreviewRows(null);
    setImportSummary(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewRows(null);
    setImportSummary(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handlePreview = async () => {
    if (selectedFiles.length === 0) return;
    setLoadingPreview(true);
    setErrorMsg(null);
    try {
      const res = await adminService.previewImportBooks(selectedFiles);
      if (res && res.data) {
        setPreviewRows(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to generate Excel preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteImport = async () => {
    if (selectedFiles.length === 0) return;
    setLoadingImport(true);
    setErrorMsg(null);
    try {
      const res = await adminService.executeImportBooks(selectedFiles);
      if (res && res.data) {
        setImportSummary(res.data);
        setPreviewRows(null);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Excel import execution failed.');
    } finally {
      setLoadingImport(false);
    }
  };

  const downloadReportCsv = () => {
    if (!importSummary) return;
    const headers = ['File Name', 'Row Number', 'Title', 'Author', 'Category', 'ISBN', 'Status', 'Validation Message'];
    const rows = importSummary.previewRows.map(r => [
      `"${r.fileName || ''}"`,
      r.rowNumber,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.author || '').replace(/"/g, '""')}"`,
      `"${(r.categoryName || '').replace(/"/g, '""')}"`,
      `"${r.isbn || ''}"`,
      r.status,
      `"${(r.validationMessage || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `book_import_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImportForm = () => {
    setSelectedFiles([]);
    setPreviewRows(null);
    setImportSummary(null);
    setErrorMsg(null);
  };

  const exportUsersCsv = () => {
    if (usersList.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status'];
    const rows = usersList.map(u => [
      u.id,
      `"${(u.fullName || u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      u.role,
      u.status || 'ACTIVE'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${Date.now()}.csv`;
    link.click();
  };

  const exportBooksCsv = () => {
    if (booksList.length === 0) return;
    const headers = ['ID', 'Title', 'Author', 'Category', 'ISBN', 'Rating', 'Language', 'Year', 'Status'];
    const rows = booksList.map(b => [
      b.id,
      `"${(b.title || '').replace(/"/g, '""')}"`,
      `"${(b.author || '').replace(/"/g, '""')}"`,
      `"${(b.category?.name || b.categoryName || '').replace(/"/g, '""')}"`,
      `"${b.isbn || ''}"`,
      b.rating,
      `"${b.language || ''}"`,
      b.publicationYear,
      b.status || 'PUBLISHED'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `books_export_${Date.now()}.csv`;
    link.click();
  };

  return (
    <AppLayout>
            {/* ── Header ── */}
            <section className="mb-6 sm:mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2.5 sm:gap-3 text-primary">
                  <span className="material-symbols-outlined text-primary text-2xl sm:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    admin_panel_settings
                  </span>
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Manage users, inventory, system statistics, and bulk Excel data imports.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap overflow-x-auto custom-scrollbar pb-1 w-full lg:w-auto">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[38px] ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-md' : 'bg-surface-container hover:bg-primary/10'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[38px] ${activeTab === 'users' ? 'bg-primary text-white shadow-md' : 'bg-surface-container hover:bg-primary/10'}`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('books')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[38px] ${activeTab === 'books' ? 'bg-primary text-white shadow-md' : 'bg-surface-container hover:bg-primary/10'}`}
                >
                  Books
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px] ${activeTab === 'import' ? 'bg-primary text-white shadow-md' : 'bg-surface-container hover:bg-primary/10 text-primary'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  Import Books
                </button>
              </div>
            </section>

        {/* ── Dashboard Tab ── */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-gutter">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {loadingData ? (
                <div className="col-span-full py-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"/></div>
              ) : (
                [
                  { label: 'Total Users', value: dashboardStats?.totalUsers ?? '—', icon: 'group', color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'Total Books', value: dashboardStats?.totalBooks ?? '—', icon: 'library_books', color: 'text-secondary', bg: 'bg-secondary/10' },
                  { label: 'Active Sessions', value: dashboardStats?.activeBorrowers ?? '—', icon: 'devices', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'System Health', value: dashboardStats?.systemStatus || 'OPERATIONAL', icon: 'health_and_safety', color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map(({ label, value, icon, color, bg }) => (
                  <div key={label} className="glass-card rounded-2xl p-6 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-on-surface">{value}</p>
                      <p className="text-label-sm text-on-surface-variant">{label}</p>
                    </div>
                  </div>
                ))
              )}
            </section>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
              <section className="glass-card rounded-2xl p-8 min-h-[300px]">
                <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  Recommendation Engine
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-surface-container rounded-xl">
                    <span className="text-on-surface-variant font-medium">Active Algorithm</span>
                    <span className="text-on-surface font-bold text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">{recommendationStats?.activeAlgorithm || 'Aggregator Pattern'}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-surface-container rounded-xl">
                    <span className="text-on-surface-variant font-medium">Cache Status</span>
                    <span className="text-on-surface font-bold text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-current"></span>{recommendationStats?.cacheStatus || 'ENABLED'}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-surface-container rounded-xl">
                    <span className="text-on-surface-variant font-medium">Total Recommendations Generated</span>
                    <span className="text-on-surface font-bold">{recommendationStats?.totalRecommendationsGenerated || 0}</span>
                  </div>
                </div>
              </section>

              <section className="glass-card rounded-2xl p-8 min-h-[300px]">
                <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">category</span>
                  Popular Categories
                </h3>
                <div className="space-y-3">
                  {popularCategories.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-3 hover:bg-surface-container rounded-xl transition-colors">
                      <span className="text-on-surface font-medium flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        {c.name}
                      </span>
                      <span className="text-on-surface-variant text-sm font-bold">{c.count} Books</span>
                    </div>
                  ))}
                  {popularCategories.length === 0 && <p className="text-on-surface-variant text-sm">No category data available.</p>}
                </div>
              </section>

              <section className="glass-card rounded-2xl p-8 min-h-[300px] lg:col-span-2">
                <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">person</span>
                  Popular Authors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {popularAuthors.map((a, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors">
                      <span className="text-on-surface font-medium truncate pr-2">{a.author}</span>
                      <span className="text-on-surface-variant text-sm font-bold shrink-0">{a.count} Books</span>
                    </div>
                  ))}
                  {popularAuthors.length === 0 && <p className="text-on-surface-variant text-sm">No author data available.</p>}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div className="glass-card rounded-2xl p-8 overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-md text-body-lg font-bold">Manage Users</h2>
                <div className="flex gap-2">
                  <button onClick={exportUsersCsv} className="px-4 py-2 bg-surface-container text-primary border border-primary/30 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-primary/10 cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
                  </button>
                  <button className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 text-sm font-semibold hover:opacity-90 cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">add</span> Add User
                  </button>
                </div>
            </div>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant/30 text-label-sm text-on-surface-variant uppercase tracking-wider">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingData ? (
                  <tr><td colSpan={5} className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"/></td></tr>
                ) : usersList.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No users found.</td></tr>
                ) : (
                  usersList.map((user: any) => (
                    <tr key={user.id} className="border-b border-outline-variant/10 hover:bg-surface-container/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img 
                          src={user.avatar ? (user.avatar.includes('/') ? user.avatar : `/avatars/${user.avatar}`) : '/avatars/avatar1.png'} 
                          alt="avatar" onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} 
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant/30 bg-surface-container" 
                        />
                        <span className="text-body-md font-medium">{user.fullName || user.name || 'Unknown User'}</span>
                      </td>
                      <td className="p-4 text-body-md text-on-surface-variant">{user.email}</td>
                      <td className="p-4 text-body-md">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' || user.role === 'Admin' ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                              {user.role}
                          </span>
                      </td>
                      <td className="p-4 text-body-md">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1 ${(user.status || 'Active') === 'Active' || (user.status || 'ACTIVE') === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {user.status || 'ACTIVE'}
                          </span>
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" title="Edit">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Books Tab ── */}
        {activeTab === 'books' && (
          <div className="glass-card rounded-2xl p-8 overflow-x-auto">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="font-headline-md text-body-lg font-bold">Manage Books</h2>
                
                {/* Search Bar */}
                <div className="flex-1 max-w-md relative">
                  <input
                    type="text"
                    placeholder="Search by title, author, or keyword..."
                    value={bookSearchQuery}
                    onChange={(e) => {
                      setBookSearchQuery(e.target.value);
                      setBookPage(0); // Reset to first page on search
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    search
                  </span>
                </div>

                <div className="flex gap-3 shrink-0">
                  <button onClick={exportBooksCsv} className="px-4 py-2 bg-surface-container text-primary border border-primary/30 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-primary/10 transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
                  </button>
                  <button
                    onClick={() => setActiveTab('import')}
                    className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-primary/20 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">upload_file</span> Bulk Excel Import
                  </button>
                  <button
                    onClick={openAddBookModal}
                    className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 text-sm font-semibold hover:opacity-90 cursor-pointer shadow-md"
                  >
                      <span className="material-symbols-outlined text-[18px]">add</span> Add Single Book
                  </button>
                </div>
            </div>
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-outline-variant/30 text-label-sm text-on-surface-variant uppercase tracking-wider">
                  <th className="p-4 font-semibold">Cover</th>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Author</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">ISBN</th>
                  <th className="p-4 font-semibold">Digital File</th>
                  <th className="p-4 font-semibold">Rating</th>
                  <th className="p-4 font-semibold">Language</th>
                  <th className="p-4 font-semibold">Year</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingData ? (
                  <tr><td colSpan={10} className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"/></td></tr>
                ) : booksList.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-on-surface-variant">No books available</td></tr>
                ) : (
                  booksList.map((book: any) => (
                    <tr key={book.id} className="border-b border-outline-variant/10 hover:bg-surface-container/50 transition-colors">
                      <td className="p-4">
                        {book.coverImage ? (
                          <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm" />
                        ) : (
                          <div className="w-10 h-14 bg-surface-container rounded flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-on-surface-variant/50">menu_book</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-body-md font-medium max-w-[200px] truncate" title={book.title}>{book.title}</td>
                      <td className="p-4 text-body-md text-on-surface-variant max-w-[150px] truncate">{book.author}</td>
                      <td className="p-4 text-body-md text-on-surface-variant">{book.category?.name || book.categoryName || 'N/A'}</td>
                      <td className="p-4 text-body-md text-on-surface-variant font-mono text-xs">{book.isbn || '—'}</td>
                      <td className="p-4 text-body-md">
                        {book.bookFileUrl ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span> PDF Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant/70">
                            No PDF
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-body-md text-amber-600 font-bold">⭐ {book.rating || '0.0'}</td>
                      <td className="p-4 text-body-md text-on-surface-variant">{book.language || '—'}</td>
                      <td className="p-4 text-body-md text-on-surface-variant">{book.publicationYear || '—'}</td>
                      <td className="p-4 flex justify-end gap-2 items-center h-full pt-6">
                        <button
                          onClick={() => openEditBookModal(book)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit Book"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Book"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {bookTotalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-outline-variant/20">
                <p className="text-sm text-on-surface-variant font-medium">
                  Page {bookPage + 1} of {bookTotalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={bookPage === 0 || loadingData}
                    onClick={() => setBookPage(prev => Math.max(0, prev - 1))}
                    className="px-4 py-2 bg-surface-container hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span> Prev
                  </button>
                  <button
                    disabled={bookPage >= bookTotalPages - 1 || loadingData}
                    onClick={() => setBookPage(prev => Math.min(bookTotalPages - 1, prev + 1))}
                    className="px-4 py-2 bg-surface-container hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Next <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Book Import Module ── */}
        {activeTab === 'import' && (
          <div className="space-y-8 fade-in">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center justify-between">
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {/* Step 1: Upload & Drag-and-Drop Area */}
            {!importSummary && (
              <div className="glass-card rounded-3xl p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-on-surface">Bulk Excel Book Import</h2>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Upload `.xlsx` or `.xls` files. Multi-format headers (Format A, B, C) are detected automatically.
                    </p>
                  </div>
                  {selectedFiles.length > 0 && (
                    <button
                      onClick={resetImportForm}
                      className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : 'border-outline-variant/40 hover:border-primary/50 bg-surface/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    multiple
                    onChange={e => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">upload_file</span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">
                    Drag and drop your Excel dataset files here
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Supports <span className="font-semibold text-primary">.xlsx</span> and <span className="font-semibold text-primary">.xls</span> format (multiple file selection supported)
                  </p>
                  <button
                    type="button"
                    className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all cursor-pointer"
                  >
                    Browse Files
                  </button>
                </div>

                {/* Selected Files Badge List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Selected Files ({selectedFiles.length})
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 px-4 py-2.5 bg-surface-container rounded-xl text-sm font-medium border border-outline-variant/20 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-emerald-600">description</span>
                          <span className="truncate max-w-[220px]">{file.name}</span>
                          <span className="text-xs text-on-surface-variant">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="text-on-surface-variant/60 hover:text-red-500 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handlePreview}
                        disabled={loadingPreview || loadingImport}
                        className="px-6 py-3 rounded-xl bg-surface-container-high hover:bg-primary/10 text-primary border border-primary/30 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {loadingPreview && <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
                        Preview Dataset Rows
                      </button>

                      <button
                        onClick={handleExecuteImport}
                        disabled={loadingImport || loadingPreview}
                        className="px-8 py-3 rounded-xl bg-primary text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all cursor-pointer"
                      >
                        {loadingImport && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                        Confirm &amp; Import All Books
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Preview Table */}
            {previewRows && previewRows.length > 0 && !importSummary && (
              <div className="glass-card rounded-3xl p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Dataset Row Preview</h3>
                    <p className="text-sm text-on-surface-variant">
                      Showing {previewRows.length} parsed book entries before committing to MySQL.
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-semibold">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                      Valid: {previewRows.filter(r => r.status === 'VALID').length}
                    </span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                      Duplicates: {previewRows.filter(r => r.status === 'DUPLICATE').length}
                    </span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                      Invalid: {previewRows.filter(r => r.status === 'INVALID').length}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[420px] border border-outline-variant/20 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-surface-container sticky top-0 z-10">
                      <tr className="text-on-surface-variant uppercase font-semibold">
                        <th className="p-3">#</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Author</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">ISBN</th>
                        <th className="p-3">Year</th>
                        <th className="p-3">Rating</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-surface-container/40">
                          <td className="p-3 font-mono">{row.rowNumber}</td>
                          <td className="p-3 font-medium max-w-[200px] truncate">{row.title}</td>
                          <td className="p-3 text-on-surface-variant">{row.author}</td>
                          <td className="p-3">{row.categoryName}</td>
                          <td className="p-3 font-mono">{row.isbn || '—'}</td>
                          <td className="p-3">{row.publicationYear}</td>
                          <td className="p-3 font-bold text-amber-600">⭐ {row.rating}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.status === 'VALID'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : row.status === 'DUPLICATE'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-4 pt-2">
                  <button
                    onClick={resetImportForm}
                    className="px-6 py-2.5 rounded-xl border border-outline-variant/40 text-sm font-semibold hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteImport}
                    disabled={loadingImport}
                    className="px-8 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:opacity-90 cursor-pointer"
                  >
                    Execute Import
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Summary Report View */}
            {importSummary && (
              <div className="glass-card rounded-3xl p-8 space-y-8 fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/20 pb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-2">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Import Complete
                    </div>
                    <h2 className="text-2xl font-bold text-on-surface">Excel Book Import Summary</h2>
                    <p className="text-sm text-on-surface-variant">
                      Batch processed in {importSummary.importDurationMs} ms with {importSummary.successRate}% success rate.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={downloadReportCsv}
                      className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-primary/10 text-primary border border-primary/30 text-sm font-bold flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                      Download CSV Report
                    </button>
                    <button
                      onClick={() => setActiveTab('books')}
                      className="px-6 py-2.5 rounded-xl bg-surface-container hover:bg-primary/10 text-primary border border-primary/30 text-sm font-bold flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">library_books</span>
                      View Imported Books
                    </button>
                    <button
                      onClick={resetImportForm}
                      className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:opacity-90 cursor-pointer"
                    >
                      Import Another Batch
                    </button>
                  </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/20 text-center">
                    <p className="text-xs text-on-surface-variant font-semibold">Imported</p>
                    <p className="text-3xl font-extrabold text-emerald-600 mt-1">{importSummary.booksImported}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/20 text-center">
                    <p className="text-xs text-on-surface-variant font-semibold">Skipped</p>
                    <p className="text-3xl font-extrabold text-red-500 mt-1">{importSummary.booksSkipped || (importSummary.duplicatesSkipped + importSummary.invalidRowsSkipped)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/20 text-center">
                    <p className="text-xs text-on-surface-variant font-semibold">Duplicates</p>
                    <p className="text-3xl font-extrabold text-amber-600 mt-1">{importSummary.duplicatesSkipped}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/20 text-center">
                    <p className="text-xs text-on-surface-variant font-semibold">Invalid</p>
                    <p className="text-3xl font-extrabold text-red-600 mt-1">{importSummary.invalidRowsSkipped}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/20 text-center">
                    <p className="text-xs text-on-surface-variant font-semibold">Categories</p>
                    <p className="text-3xl font-extrabold text-primary mt-1">{importSummary.categoriesCreated}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/20 text-center">
                    <p className="text-xs text-on-surface-variant font-semibold">Authors</p>
                    <p className="text-3xl font-extrabold text-primary mt-1">{importSummary.authorsCreated || 0}</p>
                  </div>
                </div>

                {/* Log Messages Console */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                    Import Execution Logs
                  </h3>
                  <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs max-h-[240px] overflow-y-auto space-y-1.5 scroll-hide border border-slate-800">
                    {importSummary.logMessages.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-emerald-400">►</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Import History Section ── */}
        {activeTab === 'import' && importHistoryList.length > 0 && !importSummary && !previewRows && (
          <div className="glass-card rounded-3xl p-8 space-y-6 mt-8">
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">history</span>
              Previous Imports
            </h3>
            <div className="overflow-x-auto border border-outline-variant/20 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-surface-container">
                  <tr className="text-on-surface-variant font-semibold">
                    <th className="p-4">Date</th>
                    <th className="p-4">File Name</th>
                    <th className="p-4">Imported By</th>
                    <th className="p-4">Books Added</th>
                    <th className="p-4">Duplicates</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {importHistoryList.map((history, idx) => (
                    <tr key={idx} className="hover:bg-surface-container/40">
                      <td className="p-4 whitespace-nowrap">{new Date(history.importDate).toLocaleString()}</td>
                      <td className="p-4 font-medium max-w-[200px] truncate" title={history.filename}>{history.filename}</td>
                      <td className="p-4 text-on-surface-variant">{history.importedBy}</td>
                      <td className="p-4 font-bold text-emerald-600">+{history.booksImported}</td>
                      <td className="p-4 text-amber-600">{history.duplicatesSkipped}</td>
                      <td className="p-4 text-on-surface-variant">{history.importDurationMs} ms</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            history.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : history.status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {history.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Single Book Add / Edit Modal ── */}
        {isBookModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface glass-card rounded-3xl border border-outline-variant/30 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-3 text-primary">
                  <span className="material-symbols-outlined text-2xl">
                    {editingBookId ? 'edit_note' : 'library_add'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                    {editingBookId ? 'Edit Book Details' : 'Add New Digital Book'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsBookModalOpen(false)}
                  className="p-1.5 text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {bookModalError && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium flex items-center justify-between">
                  <span>{bookModalError}</span>
                  <button onClick={() => setBookModalError(null)} className="text-red-500 hover:text-red-800">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveBookSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Book Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Atomic Habits"
                      value={bookFormData.title}
                      onChange={e => setBookFormData({ ...bookFormData, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Author *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. James Clear"
                      value={bookFormData.author}
                      onChange={e => setBookFormData({ ...bookFormData, author: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Category *
                    </label>
                    <select
                      value={bookFormData.categoryId}
                      onChange={e => setBookFormData({ ...bookFormData, categoryId: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                    >
                      {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* ISBN */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      ISBN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 978-0735211292"
                      value={bookFormData.isbn}
                      onChange={e => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary focus:outline-none font-mono"
                    />
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Language
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. English"
                      value={bookFormData.language}
                      onChange={e => setBookFormData({ ...bookFormData, language: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Publication Year */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Publication Year
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2018"
                      value={bookFormData.publicationYear}
                      onChange={e => setBookFormData({ ...bookFormData, publicationYear: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Pages */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Total Pages
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 320"
                      value={bookFormData.pages}
                      onChange={e => setBookFormData({ ...bookFormData, pages: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Brief overview of the book content..."
                      value={bookFormData.description}
                      onChange={e => setBookFormData({ ...bookFormData, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Keywords */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Keywords (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="habits, productivity, psychology"
                      value={bookFormData.keywords}
                      onChange={e => setBookFormData({ ...bookFormData, keywords: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Cover Image URL */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Cover Image URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={bookFormData.coverImage}
                      onChange={e => setBookFormData({ ...bookFormData, coverImage: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm border border-outline-variant/30 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* NEW: Book File PDF Upload */}
                  <div className="sm:col-span-2 border-t border-outline-variant/20 pt-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                      Digital Book File (PDF Only)
                    </label>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-surface-container p-4 rounded-2xl border border-outline-variant/30">
                      <input
                        ref={pdfFileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!file.name.toLowerCase().endsWith('.pdf')) {
                              alert('Please select a valid PDF file.');
                              return;
                            }
                            setSelectedPdfFile(file);
                          }
                        }}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => pdfFileInputRef.current?.click()}
                        className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold flex items-center gap-2 border border-primary/30 cursor-pointer transition-all shrink-0 min-h-[38px]"
                      >
                        <span className="material-symbols-outlined text-base">upload_file</span>
                        Choose PDF File
                      </button>

                      <div className="text-xs text-on-surface-variant truncate">
                        {selectedPdfFile ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-emerald-600 truncate">
                              Selected file: {selectedPdfFile.name}
                            </span>
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              File size: {(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/70 italic">
                            No new file selected (PDF format, up to 50MB)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-outline-variant/20 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl border border-outline-variant/40 text-sm font-semibold hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBook}
                    className="px-8 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingBook && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {editingBookId ? 'Save Changes' : 'Upload & Save Book'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AppLayout>
  );
};

export default Admin;
