import { combineReducers } from 'redux';

import type { ChangeVersion, Ghost } from 'simperium';
import * as A from '../action-types';
import * as T from '../../types';

const emptyMap = new Map<unknown, unknown>();

const connectionStatus: A.Reducer<T.ConnectionState> = (
  state = navigator.onLine ? 'red' : 'offline',
  action
) => (action.type === 'CHANGE_CONNECTION_STATUS' ? action.status : state);

const noteChangeVersion: A.Reducer<ChangeVersion | null> = (
  state = null,
  action
) =>
  action.type === 'SET_CHANGE_VERSION' && action.bucketName === 'note'
    ? action.cv
    : state;

const noteGhosts: A.Reducer<Map<T.EntityId, Ghost<T.Note>>> = (
  state = emptyMap as Map<T.EntityId, Ghost<T.Note>>,
  action
) => {
  switch (action.type) {
    case 'REMOVE_NOTE_GHOST': {
      if (!state.has(action.noteId)) {
        return state;
      }

      const next = new Map(state);
      next.delete(action.noteId);
      return next;
    }

    case 'SAVE_NOTE_GHOST':
      return new Map(state).set(action.noteId, action.ghost);

    default:
      return state;
  }
};

const lastSync: A.Reducer<Map<T.EntityId, number>> = (
  state = emptyMap as Map<T.EntityId, number>,
  action
) => {
  switch (action.type) {
    case 'ACKNOWLEDGE_PENDING_CHANGE':
      return new Map(state).set(action.entityId, Date.now());

    case 'REMOTE_NOTE_UPDATE':
      return action.remoteInfo
        ? new Map(state).set(action.noteId, Date.now())
        : state;

    default:
      return state;
  }
};

const lastRemoteUpdate: A.Reducer<Map<T.EntityId, number>> = (
  state = emptyMap as Map<T.EntityId, number>,
  action
) => {
  switch (action.type) {
    case 'REMOTE_NOTE_UPDATE':
      return action.remoteInfo
        ? new Map(state).set(action.noteId, Date.now())
        : state;

    default:
      return state;
  }
};

export default combineReducers({
  connectionStatus,
  noteChangeVersion,
  noteGhosts,
  lastSync,
  lastRemoteUpdate,
});
