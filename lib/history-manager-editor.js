'use babel';
'use strict';

import HistoryManagerEditorView from './history-manager-editor-view';
import { CompositeDisposable } from 'atom';

class HistoryManager {

	constructor()
	{

		this.HistoryManagerEditorView = null;
		this.modalPanel = null;
		this.subscriptions = null;

	}

	activate()
	{

		this.HistoryManagerEditorView = new HistoryManagerEditorView();

		this.modalPanel = atom.workspace.addModalPanel({
			item: this.HistoryManagerEditorView.getElement(),
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
		
		this.HistoryManagerEditorView.modalPanel = this.modalPanel;

	}

	deactivate()
	{

		this.modalPanel.destroy();
		this.subscriptions.dispose();
		this.HistoryManagerEditorView.destroy();

	}

	serialize()
	{

		return {
			HistoryManagerEditorViewState: this.HistoryManagerEditorView.serialize()
		};

	}

	toggle()
	{

		if(!this.modalPanel.isVisible())
		{

			this.HistoryManagerEditorView.GetHistory();

		}
		return (
			this.modalPanel[this.modalPanel.isVisible() ? 'hide' : 'show']()
		);

	}

	hide()
	{

		this.modalPanel.hide();

	}

}

export default new HistoryManager();
