import {makeEl, makeText} from '/src/js/lib/ui/components/html';


let tabGroups = {};

// TODO: selection mechanics
// TODO: prefKey for selected tab per group


export class TabGroup {
    constructor(container, id) {
        this.container = container;
        this.id = id;

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
    }
}
