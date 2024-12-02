const Wallet = require('../model/Wallet')

const walletController ={
    getWalletBalance : async (req, res) => {
        try {
          const { userId } = req.query;
          console.log(userId,"kkkk");
          
          const wallet = await Wallet.findOne({ userId });
      console.log(wallet);
      console.log(wallet.balance);
          if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found for the user' });
          }
      console.log(wallet.balance);
      
          return res.status(200).json({
            balance: wallet.balance,
          });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Error fetching wallet balance', error });
        }
      },

      getWalletData : async (req, res) => {
        try {
          const { userId } = req.query;
      
          console.log(userId),"ghg";
          
          const wallet = await Wallet.findOne({ userId });
      
          if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
          }
      
          return res.status(200).json({
            balance: wallet.balance,
            transactions: wallet.transactions,
          });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Failed to load wallet data' });
        }
      },
}
module.exports = walletController