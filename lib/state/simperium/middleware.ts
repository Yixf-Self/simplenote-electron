import { default as createClient } from 'simperium';

import debugFactory from 'debug';
import actions from '../actions';
import { NoteBucket } from './functions/note-bucket';
import { start as startConnectionMonitor } from './functions/connection-monitor';
import { getAccountName } from './functions/username-monitor';

import * as A from '../action-types';
import * as S from '../';
import * as T from '../../types';

const debug = debugFactory('simperium-middleware');

function BucketStore() {
  this.objects = {};
}

BucketStore.prototype.get = function (id, callback) {
  callback(null, { id: id, data: this.objects[id] });
};

BucketStore.prototype.update = function (id, object, isIndexing, callback) {
  this.objects[id] = object;
  callback(null, { id: id, data: object, isIndexing: isIndexing });
};

BucketStore.prototype.remove = function (id, callback) {
  delete this.objects[id];
  callback(null);
};

// TODO: build a query interface
BucketStore.prototype.find = function (query, callback) {
  var objects = [];
  var key;
  for (key in this.objects) {
    objects.push({ id: key, data: this.objects[key] });
  }
  callback(null, objects);
};

type Buckets = {
  note: T.Note;
  preferences: T.Preferences;
  tag: T.Tag;
};

export const initSimperium = (
  logout: () => any,
  token: string,
  username: string | null,
  createWelcomeNote: boolean
): S.Middleware => (store) => {
  const { dispatch, getState } = store;

  const client = createClient<Buckets>('chalk-bump-f49', token, {
    objectStoreProvider: (bucket) => {
      switch (bucket.name) {
        case 'note':
          return new NoteBucket(store);

        case 'preferences':
        case 'tag':
          return new BucketStore();
      }
    },
  });
  client.on('unauthorized', () => logout());

  getAccountName(client).then((accountName) => {
    debug(`authenticated: ${accountName}`);
    dispatch(actions.settings.setAccountName(accountName));
  });

  startConnectionMonitor(client, store);

  const noteBucket = client.bucket('note');

  if (createWelcomeNote) {
    import(
      /* webpackChunkName: 'welcome-message' */ '../../welcome-message'
    ).then(({ content }) => {
      const now = Date.now() / 1000;
      noteBucket.add({
        content,
        deleted: false,
        systemTags: [],
        creationDate: now,
        modificationDate: now,
        shareURL: '',
        publishURL: '',
        tags: [],
      });
    });
  }

  const changedNotes = new Map<T.EntityId, any>();
  const queueNoteUpdate = (noteId: T.EntityId) => {
    if (changedNotes.has(noteId)) {
      clearTimeout(changedNotes.get(noteId));
    }

    const timer = setTimeout(() => noteBucket.touch(noteId), 2000);
    changedNotes.set(noteId, timer);
  };

  return (next) => (action: A.ActionType) => {
    console.log(action);
    const result = next(action);
    const nextState = store.getState();

    switch (action.type) {
      // while editing we should debounce
      // updates to prevent thrashing
      case 'CREATE_NOTE_WITH_ID':
      case 'EDIT_NOTE':
        queueNoteUpdate(action.noteId);
        return result;

      // other note editing actions however
      // should trigger an immediate sync
      case 'DELETE_NOTE_FOREVER':
      case 'IMPORT_NOTE_WITH_ID':
      case 'MARKDOWN_NOTE':
      case 'PIN_NOTE':
      case 'PUBLISH_NOTE':
      case 'RESTORE_NOTE':
      case 'TRASH_NOTE':
        noteBucket.touch(action.noteId);
        return result;

      case 'LOGOUT':
        // client.end();
        // logout();
        return result;
    }

    return result;
  };
};
