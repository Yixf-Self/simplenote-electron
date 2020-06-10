import { default as createClient } from 'simperium';

import debugFactory from 'debug';
import actions from '../actions';
import { start as startConnectionMonitor } from './functions/connection-monitor';
import { getAccountName } from './functions/username-monitor';

import * as A from '../action-types';
import * as S from '../';
import * as T from '../../types';

const debug = debugFactory('simperium-middleware');

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
  const client = createClient<Buckets>('chalk-bump-f49', token);
  client.on('unauthorized', () => logout());

  getAccountName(client).then((accountName) => {
    debug(`authenticated: ${accountName}`);
    store.dispatch(actions.settings.setAccountName(accountName));
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

  return (next) => (action: A.ActionType) => {
    const result = next(action);
    const nextState = store.getState();

    switch (action.type) {
      case 'LOGOUT':
        // client.end();
        // logout();
        return result;
    }

    return result;
  };
};
