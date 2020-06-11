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

const noteLastUpdated: A.Reducer<Map<T.EntityId, number>> = (
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

const pendingChanges: A.Reducer<Map<T.EntityId, Set<string>>> = (
  state = emptyMap as Map<T.EntityId, Set<string>>,
  action
) => {
  switch (action.type) {
    case 'ACKNOWLEDGE_PENDING_CHANGE': {
      const prevSet = state.get(action.entityId);
      if (!prevSet || !prevSet.has(action.ccid)) {
        return state;
      }

      const nextSet = new Set(prevSet);
      nextSet.delete(action.ccid);

      return new Map(state).set(action.entityId, nextSet);
    }

    case 'SUBMIT_PENDING_CHANGE':
      return new Map(state).set(
        action.entityId,
        state.has(action.entityId)
          ? new Set(state.get(action.entityId)).add(action.ccid)
          : new Set([action.ccid])
      );

    default:
      return state;
  }
};

export default combineReducers({
  connectionStatus,
  noteChangeVersion,
  noteGhosts,
  noteLastUpdated,
  pendingChanges,
});
