import * as React from 'react';
import { render } from '@testing-library/react';
import { expect } from 'chai';
import Ehr from './Ehr';

describe('<Ehr>', () => {
  it('renders learn react link', () => {
    const { getByText } = render(<Ehr />);
    const linkElement = getByText(/learn react/i);
    expect(document.body.contains(linkElement));
  });
});
