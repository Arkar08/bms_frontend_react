import { useState,useEffect } from 'react';
import SuccessMessage from '../components/transfer/SuccessMessage';
import TransferForm from '../components/transfer/TransferForm';
import { Response, RequestBody } from '../lib/types';
import useSubmitTransaction from '../hooks/useTransfer';
import { useFetchUser } from '@/hooks/useFetchUser';
import { UserData } from '../lib/types';
import { useSelector } from 'react-redux';
import { selectUsernames } from '@/store';

const NotAllowed = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px"><path fill="#f44336" d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z" /><path fill="#fff" d="M29.656,15.516l2.828,2.828l-14.14,14.14l-2.828-2.828L29.656,15.516z" /><path fill="#fff" d="M32.484,29.656l-2.828,2.828l-14.14-14.14l2.828-2.828L32.484,29.656z" /></svg>
)

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 48 48" width="24px" height="24px"><path fill="#2196f3" d="M44,24c0,11.045-8.955,20-20,20S4,35.045,4,24S12.955,4,24,4S44,12.955,44,24z"/><path fill="#fff" d="M22 22h4v11h-4V22zM26.5 16.5c0 1.379-1.121 2.5-2.5 2.5s-2.5-1.121-2.5-2.5S22.621 14 24 14 26.5 15.121 26.5 16.5z"/></svg>
)

const TransferPage = () => {
    
    const [accounts,setAccounts] = useState ({
        sender: { name: '', isTouched: false },
        recipient: { name: '', isTouched: false },
        amount: { name: '', isTouched: false },
    })

    const [data, setData] = useState<Response | null>(null)

    const [success, setSuccess] = useState(false)

    const [errorMessage, setErrorMessage] = useState(null)

    const convertAmount = parseInt(accounts.amount.name, 10)

    const [loading,setLoading] = useState(false)

    const users = useFetchUser<UserData>()

    const [userData, setUserData] = useState<UserData[]>([]);

    const { senderUsername, recipientUsername } = useSelector(selectUsernames);
    
    useEffect(() => {
      if (users.isSuccess && users.data) {
        const sortedData = users.data.sort((a: { id: number }, b: { id: number }) => {
          return b.id > a.id ? -1 : 1;
        });
        setUserData(sortedData);
      } else if (users.isError) {
        console.log(users.error);
      }
    }, [users.data, users.isError, users.isSuccess, users.isPending]);

      const handleOnChange = (field: string, value: string): void => {
        setAccounts(prevAccounts => {
          const updatedAccounts = {
            ...prevAccounts,
            [field]: {
              name: value,
              isTouched:true
            }
          };
          return updatedAccounts;
        });
      };
      
    const body: RequestBody = {
        process: 'transfer',
        data: {
            sender: senderUsername,
            receiver: recipientUsername,
            transferAmount: convertAmount,
        },
    };

    const isCompleted = Object.values(accounts).every((value)=>value.name);  

    const submitTransactionMutation = useSubmitTransaction();

    const clickHandler = () => {
      if(isCompleted) {
        submitTransactionMutation.mutate(body);
        localStorage.removeItem('accounts');
      }
    };

    useEffect(() => {
      if (submitTransactionMutation.isSuccess && submitTransactionMutation.data) {
        console.log('Mutation Success Data:', submitTransactionMutation);
        setData(submitTransactionMutation.data)
        setSuccess(true)
        setLoading(false)
      } else if (submitTransactionMutation.isPending) {
        setLoading(true)
      }else if (submitTransactionMutation.isError) {
        console.log('Mutation Error:', submitTransactionMutation.error);
        setErrorMessage(submitTransactionMutation.error.response.data.message)
        setLoading(false)
      }
    }, [
        submitTransactionMutation.isError,
        submitTransactionMutation.isSuccess,
        submitTransactionMutation.isPending,
    ]);
    

    return (
        <div className="w-full mx-auto h-screen">
            <div className={`max-w-2xl ${success || errorMessage || loading ? 'mx-auto mt-20 max-w-sm' : 'mt-8'}`}>
                <form className="bg-PrimaryBg border border-secondaryBorderColor rounded-md px-8 pt-6 pb-6">
                        {!success && !errorMessage && !loading && <TransferForm accounts={accounts} handleOnChange={handleOnChange} userData={userData}
                        isCompleted={isCompleted} clickHandler={clickHandler} />}

                        {success && <SuccessMessage data={data?.data}/>}

                        {loading && (
                        <div className='w-full flex items-center justify-center gap-2'>
                            <InfoIcon/>
                            <p className='text-sm text-center'>
                            Submitting the transfer...
                            </p> 
                        </div>
                        )}
                        {errorMessage && (
                        <div className='w-full flex items-center justify-center gap-2'>
                            <NotAllowed />
                            <p className='text-sm text-center text-deleteBtn'>
                                {errorMessage}
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}

export default TransferPage;