import {makeEl, makeText} from '/src/js/lib/ui/components/html';
import {PrefKey} from '/src/js/lib/storage';


let tabGroups = {};


export class TabGroup {
    constructor(container, id, saveSelected) {
        this.container = container;
        this.id = id;
        this.savedTab = null;
        if (saveSelected || saveSelected === undefined) {
            this.savedTab = new PrefKey('savedTabs.' + this.id, null);
        }

        this.tabsEl = makeEl('ul', {'id': this.id, role: 'tablist'}, ['nav', 'nav-tabs']);
        this.panesEl = makeEl('div', {'id': this.id + '-content'}, ['tab-content']);

        this.container.appendChild(this.tabsEl);
        this.container.appendChild(this.panesEl);

        this.tabs = {};

        tabGroups[this.id] = this;
    }

    static getGroup(id) {
        return tabGroups[id];
    }

    addTab(id, title, selected, contents) {
        this.tabs[id] = new Tab(this, id, title, selected, contents);
        if (this.savedTab && this.savedTab.val === id)
            this.tabs[id].tabJS.show();
    }

    updateSelected() {
        if (!this.savedTab) return;
        this.savedTab.val = null;
        Object.entries(this.tabs).forEach(t => { if (t[1].isSelected) this.savedTab.val = t[0]; });
    }
}

export class Tab {
    constructor(group, id, title, selected, contents) {
        this.group = group;
        this.id = id;
        this.title = title;
        this.isSelected = selected ? true : false;

        let bCls = ['nav-link'];
        let pCls = ['tab-pane', 'fade'];
        if (this.isSelected) {
            // TODO: do this elsewhere?
            bCls.push('active');
            pCls.push('show');
            pCls.push('active');
        }
        this.button = makeEl(
            'button',
            {
                'id': this.id + '-tab',
                'data-bs-toggle': 'tab',
                'data-bs-target': '#' + this.id + '-pane',
                type: 'button',
                role: 'tab',
                'aria-controls': this.id + '-pane',
                'aria-selected': this.isSelected ? 'true' : 'false',
            },
            bCls,
            [makeText(this.title)]
        );
        this.tab = makeEl('li', {role: 'presentation'}, ['nav-item'], [this.button]);
        this.pane = makeEl(
            'div',
            {'id': this.id + '-pane', role: 'tabpanel', 'aria-labelledby': this.id + '-tab'},
            pCls,
        );
        this.pane.innerHTML = contents || '';

        this.group.tabsEl.appendChild(this.tab);
        this.group.panesEl.appendChild(this.pane);

        this.tabJS = bootstrap.Tab.getOrCreateInstance(this.button);
        this.button.addEventListener('hidden.bs.tab', e => { this.isSelected = false; this.group.updateSelected(); });
        this.button.addEventListener('shown.bs.tab', e => { this.isSelected = true; this.group.updateSelected(); });
    }
}
