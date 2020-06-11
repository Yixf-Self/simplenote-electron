import type { ChangeVersion, GhostStore, Ghost } from 'simperium';
import * as S from '../../';
import * as T from '../../../types';

export class NoteGhost implements GhostStore<T.Note> {
  store: S.Store;

  constructor(store: S.Store) {
    this.store = store;
  }

  get(noteId: T.EntityId): Promise<Ghost<T.Note>> {
    const ghost = this.store.getState().simperium.noteGhosts.get(noteId);

    return ghost ? Promise.resolve(ghost) : Promise.reject();
  }

  put(
    noteId: T.EntityId,
    version: number,
    note: T.Note
  ): Promise<Ghost<T.Note>> {
    const ghost = { key: noteId, data: note, version };
    this.store.dispatch({ type: 'SAVE_NOTE_GHOST', noteId, ghost });
    return Promise.resolve(ghost);
  }

  remove(noteId: T.EntityId): Promise<Ghost<T.Note>> {
    const ghost = this.store.getState().simperium.noteGhosts.get(noteId);

    if (!ghost) {
      return Promise.reject();
    }

    this.store.dispatch({ type: 'REMOVE_NOTE_GHOST', noteId });
    return Promise.resolve(ghost);
  }

  eachGhost(iterator: (ghost: Ghost<T.Note>) => void): void {
    this.store
      .getState()
      .simperium.noteGhosts.forEach((note) => iterator(note));
  }

  getChangeVersion(): Promise<ChangeVersion> {
    const cv = this.store.getState().simperium.noteChangeVersion;

    return Promise.resolve(cv);
  }

  setChangeVersion(cv: ChangeVersion): Promise<void> {
    this.store.dispatch({
      type: 'SET_CHANGE_VERSION',
      bucketName: 'note',
      cv,
    });

    return Promise.resolve();
  }
}
