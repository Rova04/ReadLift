// 📁 Fichier : /back/controllers/bookController.js

const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

class BookController {
  constructor() {
    this.db = getFirestore();
    this.updateBookMetadata = async (req, res) => {
      try {
        const { id } = req.params;
        const { title, author } = req.body;
        const updateData = {};

        if (title !== undefined) updateData.title = title.trim();
        if (author !== undefined) updateData.author = author.trim();

        await this.db.collection('books').doc(id).update(updateData);

        res.json({ message: 'Méta données mises à jour', updated: updateData });
      } catch (error) {
        console.error('❌ Erreur updateBookMetadata:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du livre' });
      }
    };
  }

  async getAllBooks(req, res) {
    try {
      const { page = 1, limit = 10, sortBy = 'uploadDate', order = 'desc' } = req.query;
      let query = this.db.collection('books').orderBy(sortBy, order);

      const offset = (page - 1) * limit;
      if (offset > 0) {
        const snapshot = await query.limit(offset).get();
        if (!snapshot.empty) {
          const lastDoc = snapshot.docs[snapshot.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.limit(parseInt(limit)).get();
      const books = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        extractedText: undefined,
        chapters: doc.data().chapters ? doc.data().chapters.length : 0
      }));

      const totalSnapshot = await this.db.collection('books').get();
      const total = totalSnapshot.size;

      res.json({
        books,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBooks: total,
          hasNext: snapshot.docs.length === parseInt(limit),
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('❌ Erreur getAllBooks:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des livres' });
    }
  }

  async getBookById(req, res) {
    try {
      const { id } = req.params;
      const { includeContent = 'false' } = req.query;
      const doc = await this.db.collection('books').doc(id).get();

      if (!doc.exists) return res.status(404).json({ error: 'Livre non trouvé' });

      let bookData = { id: doc.id, ...doc.data() };

      if (includeContent === 'false') {
        bookData.extractedText = undefined;
        if (bookData.chapters) {
          bookData.chapters = bookData.chapters.map(ch => ({
            ...ch,
            content: undefined
          }));
        }
      }

      res.json(bookData);
    } catch (error) {
      console.error('❌ Erreur getBookById:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du livre' });
    }
  }

  async updateBookMetadata(req, res) {
    try {
      const { id } = req.params;
      const { title, author } = req.body;
      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (author !== undefined) updateData.author = author.trim();
      await this.db.collection('books').doc(id).update(updateData);
      res.json({ message: 'Méta données mises à jour', updated: updateData });
    } catch (error) {
      console.error('❌ Erreur updateBookMetadata:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du livre' });
    }
  }

  async getBookChapter(req, res) {
    try {
      const { id, chapterIndex } = req.params;
      const doc = await this.db.collection('books').doc(id).get();

      if (!doc.exists) return res.status(404).json({ error: 'Livre non trouvé' });

      const bookData = doc.data();
      const chapters = bookData.chapters || [];
      const index = parseInt(chapterIndex);

      if (index < 0 || index >= chapters.length) {
        return res.status(404).json({ error: 'Chapitre non trouvé' });
      }

      const chapter = chapters[index];

      res.json({
        bookId: id,
        bookTitle: bookData.title,
        chapter,
        navigation: {
          currentChapter: index,
          totalChapters: chapters.length,
          hasNext: index < chapters.length - 1,
          hasPrev: index > 0,
          nextChapter: index < chapters.length - 1 ? index + 1 : null,
          prevChapter: index > 0 ? index - 1 : null
        }
      });
    } catch (error) {
      console.error('❌ Erreur getBookChapter:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du chapitre' });
    }
  }

  async updateReadingProgress(req, res) {
    try {
      const { id } = req.params;
      const {
        currentPage,
        currentChapter,
        currentPosition,
        readingTime,
        bookmarks
      } = req.body;

      const updateData = {
        'readingProgress.lastReadDate': new Date().toISOString()
      };

      if (currentPage !== undefined) updateData['readingProgress.currentPage'] = Math.max(1, parseInt(currentPage));
      if (currentChapter !== undefined) updateData['readingProgress.currentChapter'] = Math.max(0, parseInt(currentChapter));
      if (currentPosition !== undefined) updateData['readingProgress.currentPosition'] = Math.max(0, parseInt(currentPosition));
      if (readingTime !== undefined) updateData['readingProgress.totalReadingTime'] = Math.max(0, parseInt(readingTime));
      if (bookmarks) updateData['readingProgress.bookmarks'] = bookmarks;

      await this.db.collection('books').doc(id).update(updateData);

      res.json({
        message: 'Progression mise à jour avec succès',
        updatedFields: Object.keys(updateData)
      });
    } catch (error) {
      console.error('❌ Erreur updateReadingProgress:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la progression' });
    }
  }

  async addBookmark(req, res) {
    try {
      const { id } = req.params;
      const { page, chapter, position, note, title } = req.body;

      const doc = await this.db.collection('books').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Livre non trouvé' });

      const bookData = doc.data();
      const bookmarks = bookData.readingProgress?.bookmarks || [];

      const newBookmark = {
        id: Date.now().toString(),
        page: page || 1,
        chapter: chapter || 0,
        position: position || 0,
        title: title || `Marque-page page ${page}`,
        note: note || '',
        createdAt: new Date().toISOString()
      };

      bookmarks.push(newBookmark);

      await this.db.collection('books').doc(id).update({
        'readingProgress.bookmarks': bookmarks
      });

      res.json({ message: 'Marque-page ajouté avec succès', bookmark: newBookmark });
    } catch (error) {
      console.error('❌ Erreur addBookmark:', error);
      res.status(500).json({ error: 'Erreur lors de l\'ajout du marque-page' });
    }
  }

  async removeBookmark(req, res) {
    try {
      const { id, bookmarkId } = req.params;

      const doc = await this.db.collection('books').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Livre non trouvé' });

      const bookData = doc.data();
      const bookmarks = bookData.readingProgress?.bookmarks || [];
      const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId);

      await this.db.collection('books').doc(id).update({
        'readingProgress.bookmarks': updatedBookmarks
      });

      res.json({ message: 'Marque-page supprimé avec succès' });
    } catch (error) {
      console.error('❌ Erreur removeBookmark:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression du marque-page' });
    }
  }

  async markAsCompleted(req, res) {
    try {
      const { id } = req.params;

      await this.db.collection('books').doc(id).update({
        'readingProgress.isCompleted': true,
        'readingProgress.completedDate': new Date().toISOString(),
        'readingProgress.lastReadDate': new Date().toISOString()
      });

      res.json({ message: 'Livre marqué comme terminé avec succès' });
    } catch (error) {
      console.error('❌ Erreur markAsCompleted:', error);
      res.status(500).json({ error: 'Erreur lors du marquage comme terminé' });
    }
  }

  async deleteBook(req, res) {
    try {
      const { id } = req.params;
      const doc = await this.db.collection('books').doc(id).get();

      if (doc.exists) {
        const bookData = doc.data();

        // Si le fichier est stocké localement, on peut le supprimer
        if (bookData.localFileName) {
          const filePath = path.join(__dirname, '../uploads', bookData.localFileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      await this.db.collection('books').doc(id).delete();

      res.json({ message: 'Livre supprimé avec succès' });
    } catch (error) {
      console.error('❌ Erreur deleteBook:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression du livre' });
    }
  }

  async searchBooks(req, res) {
    try {
      const { q, type = 'title' } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: 'Terme de recherche requis' });
      }

      const searchTerm = q.toLowerCase().trim();
      let results = [];

      const snapshot = await this.db.collection('books').get();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let match = false;

        switch (type) {
          case 'title':
            match = data.title?.toLowerCase().includes(searchTerm);
            break;
          case 'author':
            match = data.author?.toLowerCase().includes(searchTerm);
            break;
          case 'content':
            match = data.extractedText?.toLowerCase().includes(searchTerm);
            break;
          case 'all':
          default:
            match =
              data.title?.toLowerCase().includes(searchTerm) ||
              data.author?.toLowerCase().includes(searchTerm) ||
              data.summary?.toLowerCase().includes(searchTerm);
            break;
        }

        if (match) {
          results.push({
            id: doc.id,
            ...data,
            extractedText: undefined,
            chapters: data.chapters ? data.chapters.length : 0
          });
        }
      });

      res.json({
        query: q,
        type,
        results,
        count: results.length
      });
    } catch (error) {
      console.error('❌ Erreur searchBooks:', error);
      res.status(500).json({ error: 'Erreur lors de la recherche' });
    }
  }
}

module.exports = new BookController();
