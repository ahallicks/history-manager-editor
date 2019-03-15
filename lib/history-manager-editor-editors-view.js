'use babel';

export default class HistoryManagerEditorView {

	constructor(serializedState)
	{

		// DB deets
		this.databaseName = 'AtomEnvironments';
		this.version =  1;

		// Create root element
		this.element = document.createElement('div');
		this.element.classList.add('history-manager-editor', 'settings-view');

		// Create message element
		const objHead = document.createElement('h1');
		objHead.textContent = 'History Manager Editor';
		objHead.classList.add('history-manager-editor--header');
		this.element.appendChild(objHead);

		this.searchEditor = document.createElement('atom-text-editor');
		this.searchEditor.setAttribute('mini', true);
		this.searchEditor.addEventListener('keyup', this.Search.bind(this));
		this.element.appendChild(this.searchEditor);

		this.container = document.createElement('ul');
		this.container.classList.add('history-manager-editor--list');
		this.element.appendChild(this.container);

		// Fetch all results
		this.getEntries();

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

	getElement()
	{

		return this.element;

	}

	dbPromise()
	{

		if (!this._dbPromise)
		{

			this._dbPromise = new Promise(resolve => {

				const dbOpenRequest = window.indexedDB.open(this.databaseName, this.version);
				dbOpenRequest.onupgradeneeded = event => {

					let db = event.target.result;
					db.createObjectStore('states');

				};

				dbOpenRequest.onsuccess = () => {

					this.connected = true;
					resolve(dbOpenRequest.result);

				};

				dbOpenRequest.onerror = error => {

					console.error('Could not connect to indexedDB', error);
					this.connected = false;
					resolve(null);

				};

			});

		}

		return this._dbPromise;

	}

	isConnected()
	{

		return this.connected;

	}

	connect()
	{

		return this.dbPromise.then((db) => !!db);

	}

	save(key, value)
	{

		return new Promise((resolve, reject) => {

			this.dbPromise.then(db => {

				if (!db){ return resolve(); }

				const request = db.transaction(['states'], 'readwrite').objectStore('states').put({ value : value, storedAt : new Date().toString()}, key);
				request.onsuccess = resolve;
				request.onerror = reject;

			});

		});

	}

	load(key)
	{

		return this.dbPromise.then(db => {

			if (!db){ return; }

			return new Promise((resolve, reject) => {

				const request = db.transaction(['states']).objectStore('states').get(key);

				request.onsuccess = event => {

					let result = event.target.result;
					if(result && !result.isJSON)
					{

						resolve(result.value);

					} else {

						resolve(null);

					}

				};

				request.onerror = event => reject(event);

			});

		});

	}

	delete(key)
	{

		return new Promise((resolve, reject) => {

			this.dbPromise.then(db => {

				if(db === null){ return resolve(); }

				const request = db.transaction(['states'], 'readwrite').objectStore('states').delete(key);

				request.onsuccess = resolve;
				request.onerror = reject;

			});

		});

	}

	clear()
	{

		return this.dbPromise.then(db => {

			if (!db){ return; }

			return new Promise((resolve, reject) => {
				const request = db.transaction(['states'], 'readwrite').objectStore('states').clear();

				request.onsuccess = resolve;
				request.onerror = reject;

			});

		});

	}

	count()
	{

		return this.dbPromise.then(db => {

			if (!db){ return; }

			return new Promise((resolve, reject) => {

				const request = db.transaction(['states']).objectStore('states').count();
				request.onsuccess = () => resolve(request.result);
				request.onerror = reject;

			});

		});

	}

	getEntries()
	{

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

			this.GetKeys().then(() => {

				// Get all entries from the DB
				this.objDbStore = this.objDb.transaction('states', 'readwrite').objectStore('states');
				var objRequest = this.objDbStore.getAll();
				objRequest.onerror = error => console.log(error);
				objRequest.onsuccess = event => {

					// Do something with the request.result!
					// console.log(event);
					// console.log(event.target.result);
					this.container.innerHTML = '';
					this.entries = event.target.result;
					this.BuildList(this.entries);

				};

			}).catch(error => console.log(error));

		};
		this.objDBRequest.onerror = error => console.log(error);

	}

	BuildList(arrEntries)
	{

		// Reset the list
		this.container.innerHTML = '';

		// Loop through any entries we have any append them
		arrEntries.forEach((objEntry, intI) => {

			const objItem = objEntry.value;
			if(!objItem.projects)
			{

				const objLi = document.createElement('li');
				objLi.classList.add('history-manager-editor--card', 'package-card');
				this.container.appendChild(objLi);

				const objProject = document.createElement('div');
				objProject.classList.add('history-manager-editor--card__project');
				objProject.innerHTML = objItem.project.paths.join('<br>');
				objLi.appendChild(objProject);

				const objControls = document.createElement('div');
				objControls.classList.add('history-manager-editor--card__controls');
				objLi.appendChild(objControls);

				const objToolbar = document.createElement('div');
				objToolbar.classList.add('btn-toolbar');
				objControls.appendChild(objToolbar);

				const objGroup = document.createElement('div');
				objGroup.classList.add('btn-group');
				objToolbar.appendChild(objGroup);

				const objUpdate = document.createElement('button');
				objUpdate.setAttribute('type', 'button');
				objUpdate.setAttribute('index', intI);
				objUpdate.classList.add('btn', 'icon', 'icon-pencil');
				objUpdate.textContent = 'Update';
				objUpdate.addEventListener('click', this.Update.bind(this));
				objGroup.appendChild(objUpdate);

				const objDelete = document.createElement('button');
				objDelete.setAttribute('type', 'button');
				objDelete.setAttribute('index', intI);
				objDelete.classList.add('btn', 'icon', 'icon-trashcan');
				objDelete.textContent = 'Remove';
				objDelete.addEventListener('click', this.Remove.bind(this));
				objGroup.appendChild(objDelete);

			}

		});

	}

	GetKeys()
	{

		return new Promise((resolve, reject) => {

			const objRequest = this.objDbStore.getAllKeys();
			objRequest.onsuccess = event => {

				this.arrKeys = event.target.result;
				resolve();

			};
			objRequest.onerror = error => reject(error);

		});

	}

	Update(e)
	{

		console.log('Update clicked');

		console.log(e.currentTarget);
		console.log(e.currentTarget.getAttribute('index'));

	}

	Remove(e)
	{

		const intIndex = parseInt(e.currentTarget.getAttribute('index'));
		this.objDbStore = this.objDb.transaction('states', 'readwrite').objectStore('states');
		const objDel = this.objDbStore.delete(this.arrKeys[intIndex]);
		objDel.onsuccess = () => {

			console.log('Delete successful. Refetching entries.');
			// console.log(event);
			const objEl = e.target.parentNode.parentNode.parentNode.parentNode;
			objEl.parentNode.removeChild(objEl);

			// this.getEntries();

		};
		objDel.onerror = error => console.log(error);

	}

	Search()
	{

		// console.log(this.searchEditor.getModel().getBuffer().getText());
		// console.log(this.entries);
		const strText = this.searchEditor.getModel().getBuffer().getText().toLowerCase();
		const arrFiltered = this.entries.filter(objEntry => {

			if(!objEntry.value.projects)
			{

				const strCheck = objEntry.value.project.paths.join(' ').toLowerCase();
				// console.log(strCheck, strText, strCheck.indexOf(strText));
				return strCheck.indexOf(strText) !== -1 ? objEntry : null;

			} else {

				return null;

			}

		});
		strText === '' ? this.BuildList(this.entries) : this.BuildList(arrFiltered);

	}

}
