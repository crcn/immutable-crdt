import * as  React from "react";
import styled from "styled-components";

const App = styled.div`
  margin: 0px
  color: red;
`;

export class MainComponent extends React.Component {
  render() {
    return <App>Hello</App>;
  }
}