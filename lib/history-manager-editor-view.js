'use babel';

export default class HistoryManagerEditorView {

	constructor(serializedState)
	{

		// DB deets
		this.databaseName = 'AtomEnvironments';
		this.version =  1;
		this.strClass = 'history-manager-editor';
		this.tooltips = {};

		// Create root element
		this.element = document.createElement('div');
		this.element.classList.add(this.strClass, 'settings-view');

		// Create message element
		const objHead = document.createElement('h1');
		objHead.textContent = 'History Manager Editor';
		objHead.classList.add(`${this.strClass}--header`);
		this.element.appendChild(objHead);

		this.counter = document.createElement('small');
		this.counter.id = `${this.strClass}--counter`;
		this.counter.classList.add(`${this.strClass}--counter`);
		this.counter.textContent = '';
		objHead.appendChild(this.counter);

		this.searchEditor = document.createElement('atom-text-editor');
		this.searchEditor.setAttribute('mini', true);
		this.searchEditor.addEventListener('keyup', this.Search.bind(this));
		this.element.appendChild(this.searchEditor);

		this.container = document.createElement('ul');
		this.container.classList.add(`${this.strClass}--list`);
		this.element.appendChild(this.container);

		// Fetch all results
		this.getHistory().catch(error => console.log(error));

	}

	// Returns an object that can be retrieved when package is activated
	serialize()
	{

	}

	// Tear down any state and detach
	destroy()
	{

		this.element.remove();

	}

	// Returns the element (modal)
	getElement()
	{

		return this.element;

	}

	// Gets the history object from IndexedDB
	// Returns a Promise
	getHistory()
	{

		return new Promise((resolve, reject) => {

			// Add loader
			this.container.innerHTML = `<div class="history-manager-editor--loader">
				<svg class="history-manager-editor--circular" viewBox="25 25 50 50">
					<circle class="history-manager-editor--circular__path-outline" cx="50" cy="50" r="20" fill="none" stroke-width="1" stroke-miterlimit="10"/>
					<circle class="history-manager-editor--circular__path" cx="50" cy="50" r="20" fill="none" stroke-width="1" stroke-miterlimit="10"/>
				</svg>
			</div>`;

			this.objDBRequest = window.indexedDB.open('AtomEnvironments', 1);
			this.objDBRequest.onsuccess = event => {

				// Do something with request.result!
				// console.log(event);
				this.objDb = event.target.result;

				this.objDbStore = this.objDb.transaction('states', 'readwrite').objectStore('states');
				this.objDbHistory = this.objDbStore.get('history-manager');
				this.objDbHistory.onsuccess = event => {

					// Do something with request.result!
					this.container.innerHTML = '';
					this.result = event.target.result;
					this.entries = this.result.value.projects;
					this.counter.textContent = this.entries.length;
					this.BuildList(this.entries);

					// All done
					resolve();

				};
				this.objDbHistory.onerror = error => reject(error);

			};
			this.objDBRequest.onerror = error => reject(error);

		});

	}

	// Creates the DOM to show the entries in the modal
	BuildList(arrEntries)
	{

		// Reset the list
		this.container.innerHTML = '';

		// Loop through any entries we have any append them
		arrEntries.forEach(objEntry => {

			const intIndex = this.entries.indexOf(objEntry);
			const objLi = document.createElement('li');
			objLi.classList.add('history-manager-editor--card', 'package-card');
			this.container.appendChild(objLi);

			const objProject = document.createElement('div');
			objProject.classList.add('history-manager-editor--card__project');
			objLi.appendChild(objProject);

			objEntry.paths.forEach(strPath => {

				const objPath = document.createElement('span');
				objPath.classList.add(`${this.strClass}--card__project--project`, 'native-key-bindings');
				objPath.textContent = strPath;
				objPath.addEventListener('click', e => {

					e.target.setAttribute('contenteditable', true);
					e.target.focus();

					// Focus the end of the line
					const range = document.createRange(); // Create a range (a range is a like the selection but invisible)
					range.selectNodeContents(e.target); // Select the entire contents of the element with the range
					range.collapse(false); // collapse the range to the end point. false means collapse to end rather than the start
					const selection = window.getSelection();//get the selection object (allows you to change selection)
					selection.removeAllRanges();//remove any selections already made
					selection.addRange(range);//make the range you have just created the visible selection

					// Set the original value if not already set
					if(!e.target.getAttribute('data-before'))
					{

						e.target.setAttribute('data-before', e.target.textContent);

					}

				});
				objPath.addEventListener('input', e => {

					let objBtn = e.target.parentNode.nextSibling.getElementsByClassName('icon-pencil')[0];
					objBtn.classList[e.target.getAttribute('data-before') === e.target.textContent ? 'add' : 'remove']('hidden');

					objBtn = e.target.parentNode.nextSibling.getElementsByClassName('icon-x')[0];
					objBtn.classList[e.target.getAttribute('data-before') === e.target.textContent ? 'add' : 'remove']('hidden');

				});
				objPath.addEventListener('blur', e => {

					e.target.removeAttribute('contenteditable');
					if(e.target.getAttribute('data-before') === e.target.textContent)
					{

						e.target.removeAttribute('data-before');

					}

				});
				objProject.appendChild(objPath);

			});

			const objControls = document.createElement('div');
			objControls.classList.add(`${this.strClass}--card__controls`);
			objLi.appendChild(objControls);

			const objToolbar = document.createElement('div');
			objToolbar.classList.add('btn-toolbar');
			objControls.appendChild(objToolbar);

			const objGroup = document.createElement('div');
			objGroup.classList.add('btn-group');
			objToolbar.appendChild(objGroup);

			const objCancel = document.createElement('button');
			objCancel.setAttribute('type', 'button');
			objCancel.classList.add('btn', 'icon', 'icon-x', 'hidden');
			// objCancel.textContent = 'Cancel';
			objCancel.addEventListener('click', this.Cancel.bind(this));
			objCancel.addEventListener('mouseover', e => this.setTooltip(e.target, true, 'Cancel Edits', intIndex + 'cancel'));
			objGroup.appendChild(objCancel);

			const objUpdate = document.createElement('button');
			objUpdate.setAttribute('type', 'button');
			objUpdate.setAttribute('index', intIndex);
			objUpdate.classList.add('btn', 'icon', 'icon-pencil', 'hidden');
			// objUpdate.textContent = 'Update';
			objUpdate.addEventListener('click', this.Update.bind(this));
			objUpdate.addEventListener('mouseover', e => this.setTooltip(e.target, true, 'Update Path', intIndex + 'update'));
			objGroup.appendChild(objUpdate);

			const objDelete = document.createElement('button');
			objDelete.setAttribute('type', 'button');
			objDelete.setAttribute('index', intIndex);
			objDelete.classList.add('btn', 'icon', 'icon-trashcan');
			// objDelete.textContent = 'Remove';
			objDelete.addEventListener('click', this.Remove.bind(this));
			objDelete.addEventListener('mouseover', e => this.setTooltip(e.target, true, 'Remove Entry', intIndex + 'remove'));
			objGroup.appendChild(objDelete);

		});

	}

	setTooltip(objEl, blnShow, strTitle, strIndex)
	{

		if (this.tooltips[strIndex] === undefined)
		{

			this.tooltips[strIndex] = atom.tooltips.add(objEl, {
				title: strTitle,
				class: `${this.strClass}--tooltip`
			});

		}

		atom.tooltips.findTooltips(objEl)[0][blnShow ? 'enable' : 'disable']();

	}

	// Update the given entry when the Update button is clicked
	Update(e)
	{

		const intScrolltop = this.container.scrollTop;
		const intIndex = parseInt(e.currentTarget.getAttribute('index'));

		const arrEls = e.currentTarget.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('history-manager-editor--card__project--project');
		const arrPaths = [];
		Array.from(arrEls).forEach(objEl => {

			if(objEl.textContent !== '')
			{

				arrPaths.push(objEl.textContent);

			}

		});

		this.entries[intIndex].paths = arrPaths;
		const objData = this.result;
		objData.value.projects = this.entries;

		this.objDbStore = this.objDb.transaction('states', 'readwrite').objectStore('states');
		const objUpdate = this.objDbStore.put(objData, 'history-manager');
		objUpdate.onsuccess = () => {

			// console.log('Update successful. Refetching entries.');
			atom.notifications.addSuccess('Update successful. Refetching entries.', {
				dismissable: true
			});
			const arrSpans = e.target.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('history-manager-editor--card__project--project');
			Array.from(arrSpans).forEach(objEl => {

				objEl.removeAttribute('data-before');

			});

			// Fetch the updated list
			this.getHistory().then(() => {

				this.Search();
				this.container.scrollTop = intScrolltop;

			}).catch(error => console.log(error));

		};
		objUpdate.onerror = error => console.log(error);

	}

	// Cancel any edits and put the paths back to how they were
	Cancel(e)
	{

		const objThis = e.target.parentNode.parentNode.parentNode.parentNode;
		const arrSpans = objThis.getElementsByClassName('history-manager-editor--card__project--project');
		Array.from(arrSpans).forEach(objEl => {

			objEl.textContent = objEl.getAttribute('data-before');
			objEl.removeAttribute('data-before');

		});

		let objBtn = objThis.getElementsByClassName('icon-pencil')[0];
		objBtn.classList.add('hidden');

		objBtn = objThis.getElementsByClassName('icon-x')[0];
		objBtn.classList.add('hidden');


	}

	// Remove the given entry with the remove button is clicked
	Remove(e)
	{

		const intScrolltop = this.container.scrollTop;
		const intIndex = parseInt(e.currentTarget.getAttribute('index'));
		this.entries.splice(intIndex, 1);

		const objData = this.result;
		objData.value.projects = this.entries;

		this.objDbStore = this.objDb.transaction('states', 'readwrite').objectStore('states');
		const objUpdate = this.objDbStore.put(objData, 'history-manager');
		objUpdate.onsuccess = () => {

			// console.log('Delete successful. Refetching entries.');
			atom.notifications.addSuccess('Delete successful. Refetching entries.', {
				dismissable: true
			});
			const objEl = e.target.parentNode.parentNode.parentNode.parentNode;
			objEl.parentNode.removeChild(objEl);

			// Fetch the updated list
			this.getHistory().then(() => {

				this.Search();
				this.container.scrollTop = intScrolltop;

			}).catch(error => console.log(error));

		};
		objUpdate.onerror = error => console.log(error);

	}

	// Searches all entries for the string in our mini editor (search field)
	Search()
	{

		// console.log(this.searchEditor.getModel().getBuffer().getText());
		// console.log(this.entries);
		const strText = this.searchEditor.getModel().getBuffer().getText().toLowerCase();
		const arrFiltered = this.entries.filter(objEntry => {

			const strCheck = objEntry.paths.join(' ').toLowerCase();
			return strCheck.indexOf(strText) !== -1 ? objEntry : null;

		});
		strText === '' ? this.BuildList(this.entries) : this.BuildList(arrFiltered);
		this.counter.textContent = strText === '' ? this.entries.length : arrFiltered.length;

	}

}
