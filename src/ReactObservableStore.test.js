import Store, { withStore } from './ReactObservableStore';
import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import {mount, shallow, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

class Component extends React.Component {
    render() {
        return <div>{this.props.foo}</div>
    }
}

class ComponentSelfUpdate extends React.Component {
    componentDidMount() {
        Store.update('namespace', { foo: 'first'});
        Store.update('namespace', { foo: 'self update'});
    }
    render() {
        return <div>{this.props.foo}</div>
    }
}

test('throws error on empty init', () => {
    expect(() => {
        Store.init();
    }).toThrow();
});

test('throws error on invalid subscribe namespace', () => {
    expect(() => {
        var id = Store.subscribe('namespace', function upd(data) {});
    }).toThrow();
});

test('throws error on invalid update namespace', () => {
    expect(() => {
        Store.update('bla', {});
    }).toThrow();
});

test('init store', () => {
    var result = Store.get('namespace');
    expect(result).toBe(null);
    Store.init({ namespace: { foo: true }});
    Store.init({ namespace: { foo: true }}, true);
    Store.init({ namespace: { foo: true }}, false);
});

test('update store', () => {
    var result, value = false;
    result = Store.get('namespace');
    Store.update('namespace', { foo: value });
    result = Store.get('namespace.foo');
    expect(result).toBe(value);
    Store.update('namespace', { foo: value }, false);
    result = Store.get('namespace.foo');
    expect(result).toBe(value);
});

test('set and get from store', () => {
    Store.init({ namespace: { foo: {nested: true }}});
    var result, value = false;
    Store.set('namespace.foo.nested', value);
    result = Store.get('namespace.foo.nested');
    expect(result).toBe(value);
    result = Store.get('namespace.foo');
    expect(result).toEqual({nested: value});
});

test('update store returns null with non-serializable values', () => {
    var result, values = [
        NaN,
        Infinity
    ];
    values.map(item => {
        Store.update('namespace', { foo: item });
        result = Store.get('namespace.foo');
        expect(result).toEqual(null);
    });
});

test('update store succeeds with serializable values', () => {
    var result, values = [
      null,
      true,
      'bar',
      9999999999,
      [],
      [[]],
      ['foo'],
      ['foo', 99999999999],
      [1,2],
      {},
      [{}],
      {a: false},
      {a: []},
      {a: {}},
      {a: {a: null}}
    ];
    values.map(item => {
      Store.update('namespace', { foo: item });
      result = Store.get('namespace.foo');
      expect(result).toEqual(item);
    });
});

test('manual subscribe and unsubscribe', (done) => {
    const change = { foo: false }
    Store.init({ namespace: { foo: true }}, true);
    var id = Store.subscribe('namespace', function upd(data) {
        expect(data).toEqual(change);
        Store.unsubscribe('namespace', id);
        done();
    });
    Store.update('namespace', change);
});

test('test withStore', () => {
    Store.init({ namespace: { foo: "bar" }}, true);
    const TestComp = withStore('namespace', Component);
    expect(TestComp).toEqual(expect.any(Function));
});

test('render withStore', () => {
    Store.init({ namespace: { foo: "bar" }}, true);
    const TestCompEmpty = withStore('empty', Component)
    const TestComp = withStore('namespace', Component)
    const wrapper = mount(<TestComp />);
    wrapper.unmount();
});

test('update observer', () => {
    Store.init({ namespace: { foo: "bar" }}, true);
    const TestComp = withStore('namespace', Component)
    const wrapper = mount(<TestComp />);
    Store.update('namespace', { foo: "baz" });
    expect(wrapper.find('div').text()).toEqual('baz');
});

test('self update', () => {
    Store.init({ namespace: { foo: "bar" }}, true);
    const TestComp = withStore('namespace', ComponentSelfUpdate)
    const wrapper = mount(<TestComp />);
    expect(wrapper.find('div').text()).toEqual('self update');
});

test('add namespace fails with wrong data', () => {
    Store.init({ namespace: { foo: true }});
    var result = Store.get('other');
    expect(result).toBe(null);
    expect(() => {
        Store.add('other', { foo: true });
    }).toThrow();
});

test('add namespace to store succeeds', () => {
    Store.init({ namespace: { foo: true }});
    var result = Store.get('other');
    expect(result).toBe(null);
    const expected = { foo: true };
    Store.add('other', { other: expected });
    var result = Store.get('other');
    expect(result).toEqual(expected);
});

test('add duplicated namespace fails', () => {
    Store.init({ namespace: { foo: true }});
    expect(() => {
        Store.add('namespace', { foo: true });
    }).toThrow();
});