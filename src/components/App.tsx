// @ts-ignore
import React, { Component } from "react";
import "./App.css";
import ContractCompiled from "./ContractCompiled";
import Dropdown from "./Dropdown";

type IProps = any;
interface IState {
  message: string;
  compiled: any;
  error: Error | null;
  fileName: any;
}
interface IOpt {
  value: string;
  label: string;
}
// @ts-ignore
const vscode = acquireVsCodeApi();
class App extends Component<IProps, IState> {
  public state: IState;
  public props: IProps;

  constructor(props: IProps) {
    super(props);
    this.state = {
      message: "",
      compiled: "",
      error: null,
      fileName: ""
    };
  }
  public componentDidMount() {
    window.addEventListener("message", event => {
      const { data } = event;
      if (data.compiled) {
        const compiled = JSON.parse(data.compiled);
        const fileName = Object.keys(compiled.sources)[0];
        this.setState({ compiled, fileName });
      }
      if(data.resetState){
        this.setState({fileName: "", compiled: ""} )
        console.log("Compiling");
        
      }
      // TODO: handle error message
    });
  }
  public changeFile = (selectedOpt: IOpt) => {
    this.setState({ fileName: selectedOpt.value });
  };

  public render() {
    const { compiled, message, fileName } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">ETHcode</h1>
        </header>
        {compiled && compiled.sources && (
          <Dropdown
            files={Object.keys(compiled.sources)}
            changeFile={this.changeFile}
          />
        )}
        <pre>{message}</pre>
        <p>
          {compiled && fileName && (
            <div className="compiledOutput">
              {Object.keys(compiled.contracts[fileName]).map(
                (contractName: string, i: number) => {
                  const bytecode =
                    compiled.contracts[fileName][contractName].evm.bytecode
                      .object;
                  const ContractABI =
                    compiled.contracts[fileName][contractName].abi;
                  return (
                    <div
                      id={contractName}
                      className="contract-container"
                      key={i}
                    >
                      {
                        <ContractCompiled
                          contractName={contractName}
                          bytecode={bytecode}
                          abi={ContractABI}
                        />
                      }
                    </div>
                  );
                }
              )}
            </div>
          )}
        </p>
      </div>
    );
  }
}
export default App;
