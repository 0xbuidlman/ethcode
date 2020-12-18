import React, { useEffect, useState, MutableRefObject } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, ButtonType, TextArea } from 'components/common/ui';
import { ABIDescription, ABIParameter, ConstructorInput, IAccount, TransactionResult } from 'types';

interface IProps {
  constructorInputRef: MutableRefObject<ConstructorInput | ConstructorInput[] | null>;
  deployedResult: TransactionResult | null;
  abi: ABIDescription[];
  currAccount: IAccount;
  testNetId: string;
  vscode: any;
}

type FormContract = {
  contractAddress: string;
  methodName: string;
  methodInputs: Array<ABIParameter>;
  payableAmount: number;
  gasSupply: number;
};

const CallForm: React.FC<IProps> = (props: IProps) => {
  const [callFunctionToggle, setCallFunctionToggle] = useState(true);
  const [methodName, setMethodName] = useState<string>('');
  const [isPayable, setIsPayable] = useState(false);
  const [methodArray, setmethodArray] = useState({});
  const [payableAmount] = useState<number>(0);

  const { control, register: contractReg, handleSubmit: handleContractSubmit, getValues, setValue } = useForm<
    FormContract
  >();

  useEffect(() => {
    window.addEventListener('message', (event) => {
      const { data } = event;
      if (data.ganacheCallResult) {
        setCallFunctionToggle(false);
      }
    });
    const { abi } = props;
    const methodArray: any = {};

    // eslint-disable-next-line no-restricted-syntax
    for (const i in abi) {
      if (abi[i].type !== 'constructor') {
        try {
          // TODO: bellow strategy to extract method names and inputs should be improved
          const methodname: string = abi[i].name! ? abi[i].name! : 'fallback';
          // if we have inputs
          // @ts-ignore
          methodArray[methodname] = {};
          // @ts-ignore
          if (abi[i].inputs && abi[i].inputs.length > 0) {
            // @ts-ignore
            // eslint-disable-next-line no-restricted-syntax, guard-for-in
            for (const i in methodArray[methodname].inputs) {
              methodArray[methodname].inputs[i].value = '';
            }
          } else {
            // @ts-ignore
            methodArray[methodname].inputs = [];
          }
          // @ts-ignore
          methodArray[methodname].stateMutability = abi[i].stateMutability;
        } catch (error) {
          console.error('Error In abi parsing: ', error);
        }
      }
    }
    setmethodArray(methodArray);
  }, []);
  useEffect(() => {
    const { deployedResult } = props;
    setValue('contractAddress', deployedResult ? deployedResult.contractAddress : '0x');
  }, [props.deployedResult]);
  const handleMethodnameInput = (
    event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setCallFunctionToggle(false);
    const methodName: string = event.target.value;
    // eslint-disable-next-line no-prototype-builtins
    if (methodName && methodArray.hasOwnProperty(methodName)) {
      setMethodName(methodName);
      // @ts-ignore
      setIsPayable(methodArray[methodName].stateMutability === 'payable');
    } else {
      setMethodName('');
      setIsPayable(false);
    }
  };
  const handleCall = () => {
    const { vscode, abi, currAccount } = props;
    setCallFunctionToggle(true);
    vscode.postMessage({
      command: 'ganache-contract-method-call',
      payload: {
        abi,
        address: getValues('contractAddress'),
        methodName,
        params: getValues('methodInputs') || [],
        gasSupply: props.constructorInputRef.current,
        // TODO: add value supply in case of payable functions
        value: payableAmount,
        from: currAccount.checksumAddr ? currAccount.checksumAddr : currAccount.value,
      },
      testNetId: props.testNetId,
    });
  };
  return (
    <form onSubmit={handleContractSubmit(handleCall)} className="form_align">
      <input
        type="text"
        className="custom_input_css"
        placeholder="Enter contract address"
        style={{ marginRight: '5px' }}
        name="contractAddress"
        defaultValue={getValues('contractAddress')}
        ref={contractReg}
      />
      <input
        type="text"
        className="custom_input_css"
        placeholder="Enter contract function name"
        name="methodName"
        ref={contractReg}
        onChange={handleMethodnameInput}
      />
      {methodName !== '' && (
        <div className="json_input_container" style={{ marginTop: '10px' }}>
          <Controller
            name="methodInputs"
            render={() => (
              <TextArea
                value={getValues('methodInputs')}
                onChange={(input: Array<ABIParameter>) => setValue('methodInputs', input)}
              />
            )}
            control={control}
          />
        </div>
      )}
      {isPayable && (
        <input
          type="number"
          className="custom_input_css"
          placeholder="Enter payable amount"
          style={{ margin: '5px' }}
          name="payableAmount"
          ref={contractReg}
          defaultValue={payableAmount}
        />
      )}
      <Button buttonType={ButtonType.Input} disabled={callFunctionToggle}>
        Call function
      </Button>
    </form>
  );
};

export default CallForm;
