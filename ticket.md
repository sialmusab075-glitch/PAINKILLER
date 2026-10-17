func req
    auth statless jwt auth
    only via
        signin {
            name
            email
        } -> send email use nodemailer
        login {

        } -> send email use nodemailer
        magiclink{
            has a link with a token
            stores in localstorage
        }

    payment/create create a 5 dollar sub payment
    payment/portal stripe portal url to cancel subs

    projected by paymentproetcted middleare
    analyze {
        binary obj (textual)
    } -> {
        parees doc if vlaid user friendly reason
        stores doc textual data in db
        run ai anysis and returns response
        out of scope chat with my resume feature
    }
    for ai related routes
    a middleware cehck for a valid subscription
    if yes then run next else redirect to a payment screen
    payment screen has a 5 dollar sub init
    
    then once payment is done
    user is allowed to only uplaod a pdf or other doc
    we will not take any text input comp in fe only uplaodes
    we will not storeg aby binary obj only text
    then we will ask ai to analyize it