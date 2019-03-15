'use babel';
'use strict';

import RecentProjectEditorView from './history-manager-editor-view';
import { CompositeDisposable } from 'atom';

export default
{

	recentProjectEditorView: null,
	modalPanel: null,
	subscriptions: null,

	activate(state)
	{

		this.recentProjectEditorView = new RecentProjectEditorView(state.recentProjectEditorViewState);
		this.modalPanel = atom.workspace.addModalPanel(
		{
			item: this.recentProjectEditorView.getElement(),
			visible: false
		});
		atom.views.getView(this.modalPanel).classList.add('history-manager-editor--modal');

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		// Register command that toggles this view
		this.subscriptions.add(atom.commands.add('atom-workspace',
		{
			'history-manager-editor:toggle': () => this.toggle()
		}));

		this.subscriptions.add(atom.commands.add('atom-text-editor', 'core:cancel', () => {

			this.hide();

		}));

	},

	deactivate()
	{

		this.modalPanel.destroy();
		this.subscriptions.dispose();
		this.recentProjectEditorView.destroy();

	},

	serialize()
	{

		return {
			recentProjectEditorViewState: this.recentProjectEditorView.serialize()
		};

	},

	toggle()
	{

		if(!this.modalPanel.isVisible())
		{

			this.recentProjectEditorView.getHistory();

		}
		return (
			this.modalPanel[this.modalPanel.isVisible() ? 'hide' : 'show']()
		);

	},

	hide()
	{

		this.modalPanel.hide();

	}

};