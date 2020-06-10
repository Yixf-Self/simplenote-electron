import { combineReducers } from 'redux';

import * as A from '../action-types';
import * as T from '../../types';

const emptyMap = new Map<unknown, unknown>();

const connectionStatus: A.Reducer<T.ConnectionState> = (
  state = navigator.onLine ? 'red' : 'offline',
  action
) => (action.type === 'CHANGE_CONNECTION_STATUS' ? action.status : state);

const noteLastUpdated: A.Reducer<Map<T.EntityId, number>> = (
  state = emptyMap as Map<T.EntityId, number>,
  action
) =>
  action.type === 'REMOTE_NOTE_UPDATE'
    ? new Map(state).set(action.noteId, Date.now())
    : state;

export default combineReducers({
  connectionStatus,
  noteLastUpdated,
});
